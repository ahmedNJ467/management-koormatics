import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Search,
  Trash2,
  User,
  Filter,
  SortAsc,
  SortDesc,
  CalendarDays,
  MapPin,
  Building,
  X,
} from "lucide-react";

// Use the uploaded Peace Business Group images - swapped positions
const STAMP_IMAGE = "/lovable-uploads/43e9df25-a96b-4a06-84fa-aede435f256d.png"; // Now used as stamp
const LOGO_IMAGE = "/lovable-uploads/cf1ef038-a300-45ad-a5f6-cafaa41ed89f.png"; // Now used as logo

const DEFAULT_COMPANY = {
  companyName: "PEACE BUSINESS GROUP",
  companyAddress: "Airport Road, Wadajir District, Mogadishu, Somalia",
  companyEmail: "reservations@peacebusinessgroup.com",
  companyPhone: "+252 61-94-94973 / +252 61-94-94974",
  stampText: "PEACE BUSINESS GROUP",
};

interface InvitationFormData {
  refNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  logo: string | ArrayBuffer | null;
  visitorName: string;
  visitorPassport: string;
  visitorNationality: string;
  visitorOrg: string;
  passportExpiry: string;
  purposeOfVisit: string;
  durationOfStay: string;
  dateOfVisit: string;
}

type InvitationLetter = Tables<"invitation_letters">;
type InvitationLetterInsert = TablesInsert<"invitation_letters">;

// Convert form data to database record
const convertFormDataToDbRecord = (
  formData: InvitationFormData,
  fileName: string,
  userId?: string
): InvitationLetterInsert => {
  return {
    ref_number: formData.refNumber,
    letter_date: formData.date,
    company_name: formData.companyName,
    company_address: formData.companyAddress,
    company_email: formData.companyEmail,
    company_phone: formData.companyPhone,
    visitor_name: formData.visitorName,
    visitor_nationality: formData.visitorNationality,
    visitor_organization: formData.visitorOrg,
    visitor_passport: formData.visitorPassport,
    passport_expiry: formData.passportExpiry,
    purpose_of_visit: formData.purposeOfVisit,
    duration_of_stay: formData.durationOfStay,
    date_of_visit: formData.dateOfVisit,
    file_name: fileName,
    generated_by: userId,
    form_data: formData as any,
  };
};

// Convert database record back to form data
const convertDbRecordToFormData = (
  record: InvitationLetter
): InvitationFormData => {
  return {
    refNumber: record.ref_number,
    date: record.letter_date,
    companyName: record.company_name,
    companyAddress: record.company_address,
    companyEmail: record.company_email,
    companyPhone: record.company_phone,
    logo: null,
    visitorName: record.visitor_name,
    visitorPassport: record.visitor_passport,
    visitorNationality: record.visitor_nationality,
    visitorOrg: record.visitor_organization,
    passportExpiry: record.passport_expiry,
    purposeOfVisit: record.purpose_of_visit,
    durationOfStay: record.duration_of_stay,
    dateOfVisit: record.date_of_visit,
  };
};

function generateRefNumber() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = now.getFullYear().toString().slice(-2);
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `PH/GM/${y}${m}${d}-${h}${min}${s}-${rand}`;
}

const InvitationLetter = () => {
  const [formData, setFormData] = useState<InvitationFormData>({
    refNumber: generateRefNumber(),
    date: new Date().toISOString().slice(0, 10),
    companyName: DEFAULT_COMPANY.companyName,
    companyAddress: DEFAULT_COMPANY.companyAddress,
    companyEmail: DEFAULT_COMPANY.companyEmail,
    companyPhone: DEFAULT_COMPANY.companyPhone,
    logo: null,
    visitorName: "",
    visitorPassport: "",
    visitorNationality: "",
    visitorOrg: "",
    passportExpiry: "",
    purposeOfVisit: "Peace Hotel Reservation",
    durationOfStay: "",
    dateOfVisit: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [history, setHistory] = useState<InvitationLetter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    nationality: "__all__",
    purpose: "__all__",
    dateFrom: "",
    dateTo: "",
    organization: "__all__",
  });
  const [sortBy, setSortBy] = useState<
    "date_desc" | "date_asc" | "name_asc" | "name_desc"
  >("date_desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, refNumber: generateRefNumber() }));
    loadHistory();
    migrateLocalStorageToDatabase();
  }, []);

  // Get current user ID
  const getCurrentUserId = async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  };

  // Load invitation letters from database
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        setIsLoadingHistory(false);
        return;
      }

      const { data, error } = await supabase
        .from("invitation_letters")
        .select("*")
        .eq("generated_by", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invitation letters:", error);
        toast.error("Failed to load invitation letters");
        setIsLoadingHistory(false);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching invitation letters:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save invitation letter to database
  const saveToHistory = async (data: InvitationFormData, fileName: string) => {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        toast.error("You must be logged in to save invitation letters");
        return;
      }

      const dbRecord = convertFormDataToDbRecord(data, fileName, userId);

      const { data: savedRecord, error } = await supabase
        .from("invitation_letters")
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        console.error("Error saving invitation letter:", error);
        toast.error("Failed to save invitation letter to database");
        return;
      }

      // Update local state
      setHistory((prev) => [savedRecord, ...prev]);
    } catch (error) {
      console.error("Error saving invitation letter:", error);
      toast.error("Failed to save invitation letter");
    }
  };

  // Delete invitation letter from database
  const deleteFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invitation_letters")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting invitation letter:", error);
        toast.error("Failed to delete invitation letter");
        return;
      }

      // Update local state
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("Invitation letter deleted successfully");
    } catch (error) {
      console.error("Error deleting invitation letter:", error);
      toast.error("Failed to delete invitation letter");
    }
  };

  // Load from database record
  const loadFromHistory = (historyItem: InvitationLetter) => {
    const formData = convertDbRecordToFormData(historyItem);
    setFormData({ ...formData, refNumber: generateRefNumber() });
    setActiveTab("generate");
    toast.success("Letter data loaded from history");
  };

  // Regenerate PDF from database record
  const regeneratePDF = async (historyItem: InvitationLetter) => {
    setLoading(true);
    try {
      const tempFormData = convertDbRecordToFormData(historyItem);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const margin = 60;
      const contentWidth = pageWidth - (margin * 2);
      let y = 60;

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Header with company info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("PEACE BUSINESS GROUP", margin, y);
      
      y += 25;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Airport Road, Wadajir District, Mogadishu, Somalia", margin, y);
      
      y += 15;
      doc.text("Email: reservations@peacebusinessgroup.com", margin, y);
      
      y += 15;
      doc.text("Phone: +252 61-94-94973 / +252 61-94-94974", margin, y);

      y += 50;

      // Document title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      const titleText = "OFFICIAL INVITATION LETTER";
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, y);

      y += 50;

      // Reference and date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Reference Number: ${tempFormData.refNumber}`, margin, y);

      const formattedDate = tempFormData.date
        ? new Date(tempFormData.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "";
      
      doc.text(`Date: ${formattedDate}`, pageWidth - margin - 150, y);

      y += 50;

      // TO section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TO:", margin, y);

      y += 25;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("The Director General", margin, y);
      
      y += 18;
      doc.text("Federal Government of Somalia", margin, y);
      
      y += 18;
      doc.text("Immigration & Nationality Agency", margin, y);

      y += 40;

      // Subject
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y - 8, contentWidth, 25, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 100, 200);
      doc.text("SUBJECT:", margin + 10, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const subjectText = `INVITATION LETTER - ${tempFormData.purposeOfVisit.toUpperCase()}`;
      doc.text(subjectText, margin + 80, y + 5);

      y += 40;

      // Body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      doc.text("Dear Sir/Madam,", margin, y);
      y += 25;

      const bodyLines = [
        "We would like to inform you that the below guest will be visiting Mogadishu and will be",
        "accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport.",
        "Peace Business Group will be responsible for his accommodation and safety while visiting",
        "Mogadishu.",
        "",
        "For further clarification you may contact Peace Hotel.",
        "",
        "Guest Details:"
      ];

      bodyLines.forEach(line => {
        doc.text(line, margin, y);
        y += 15;
      });

      y += 10;

      // Guest details box
      const boxHeight = 120;
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y, contentWidth, boxHeight, "F");
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(margin, y, contentWidth, boxHeight);

      const detailsStartY = y + 20;
      const leftCol = margin + 20;
      const rightCol = margin + (contentWidth / 2) + 10;

      // Left column
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      let detailY = detailsStartY;
      doc.text("Full Name:", leftCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(tempFormData.visitorName.toUpperCase(), leftCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Nationality:", leftCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(tempFormData.visitorNationality.toUpperCase(), leftCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Organization:", leftCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(tempFormData.visitorOrg, leftCol, detailY);

      // Right column
      detailY = detailsStartY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Passport Number:", rightCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(tempFormData.visitorPassport, rightCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Passport Expiry:", rightCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const passportExpiryFormatted = tempFormData.passportExpiry
        ? new Date(tempFormData.passportExpiry).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";
      doc.text(passportExpiryFormatted, rightCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Date of Visit:", rightCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const visitDateFormatted = tempFormData.dateOfVisit
        ? new Date(tempFormData.dateOfVisit).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";
      doc.text(visitDateFormatted, rightCol, detailY);

      // Move Y position after the box
      y += boxHeight + 30;

      // Closing paragraph
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const closingLines = [
        "We guarantee full compliance with immigration regulations and commitment to ensuring the",
        "visitor's departure within the specified timeframe.",
        "",
        "Thank you for your consideration.",
        "",
        "Yours sincerely,"
      ];

      closingLines.forEach(line => {
        doc.text(line, margin, y);
        y += 15;
      });

      y += 20;

      // Signature section
      const signatureBoxHeight = 80;
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, signatureBoxHeight, "F");

      const sigY = y + 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Authorized Signature:", margin + 20, sigY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 100, 200);
      doc.text("Mr. Bashir Osman", margin + 20, sigY + 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Chief Executive Officer", margin + 20, sigY + 40);
      doc.text("Peace Business Group", margin + 20, sigY + 55);

      // Company stamp
      try {
        const stampBase64 = await loadImageAsBase64(STAMP_IMAGE);
        doc.addImage(stampBase64, "PNG", pageWidth - 140, sigY, 80, 80);
      } catch (stampError) {
        console.log("Stamp loading error:", stampError);
        // Fallback stamp
        const sealX = pageWidth - 100;
        const sealY = sigY + 25;
        const sealRadius = 25;

        doc.setFillColor(0, 100, 200);
        doc.circle(sealX, sealY, sealRadius, "F");

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(2);
        doc.circle(sealX, sealY, sealRadius - 3);

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.text("PEACE BUSINESS", sealX - 20, sealY - 3);
        doc.text("GROUP", sealX - 8, sealY + 4);
        doc.text("SOMALIA", sealX - 12, sealY + 11);
      }

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const verifyText = "Official document digitally generated by Peace Business Group";
      const verifyWidth = doc.getTextWidth(verifyText);
      doc.text(verifyText, (pageWidth - verifyWidth) / 2, pageHeight - 40);

      const fileName = `invitation-letter-${tempFormData.visitorName.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}.pdf`;
      doc.save(fileName);

      setLoading(false);
      toast.success("PDF regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating PDF:", error);
      setLoading(false);
      toast.error("Failed to regenerate PDF. Please try again.");
    }
  };

  // Migrate localStorage data to database
  const migrateLocalStorageToDatabase = async () => {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        return;
      }

      // Get data from localStorage
      const savedHistory = localStorage.getItem("invitationLetterHistory");
      if (!savedHistory) {
        return;
      }

      const localHistory = JSON.parse(savedHistory);
      if (!Array.isArray(localHistory) || localHistory.length === 0) {
        return;
      }

      // Check if user already has data in database
      const { data: existingData } = await supabase
        .from("invitation_letters")
        .select("id")
        .eq("generated_by", userId)
        .limit(1);

      if (existingData && existingData.length > 0) {
        return; // Already migrated
      }

      // Convert and save each record
      let successCount = 0;
      for (const item of localHistory) {
        try {
          const dbRecord = convertFormDataToDbRecord(
            item.formData,
            item.fileName,
            userId
          );

          const { error } = await supabase
            .from("invitation_letters")
            .insert(dbRecord);

          if (!error) {
            successCount++;
          }
        } catch (error) {
          console.error("Error migrating individual record:", error);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully migrated ${successCount} invitation letters to database`
        );
        localStorage.removeItem("invitationLetterHistory");
        // Reload history after migration
        loadHistory();
      }
    } catch (error) {
      console.error("Error migrating localStorage data:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadImageAsBase64 = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  };

  const generatePDF = async () => {
    // Validate required fields
    if (!formData.visitorName.trim()) {
      toast.error("Please enter the guest name");
      return;
    }
    if (!formData.visitorNationality.trim()) {
      toast.error("Please enter the guest nationality");
      return;
    }
    if (!formData.visitorPassport.trim()) {
      toast.error("Please enter the passport number");
      return;
    }
    if (!formData.passportExpiry) {
      toast.error("Please enter the passport expiry date");
      return;
    }
    if (!formData.dateOfVisit) {
      toast.error("Please enter the date of visit");
      return;
    }
    if (!formData.durationOfStay.trim()) {
      toast.error("Please enter the duration of stay");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const margin = 60;
      const contentWidth = pageWidth - (margin * 2);
      let y = 60;

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Header with company info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("PEACE BUSINESS GROUP", margin, y);
      
      y += 25;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Airport Road, Wadajir District, Mogadishu, Somalia", margin, y);
      
      y += 15;
      doc.text("Email: reservations@peacebusinessgroup.com", margin, y);
      
      y += 15;
      doc.text("Phone: +252 61-94-94973 / +252 61-94-94974", margin, y);

      y += 50;

      // Document title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      const titleText = "OFFICIAL INVITATION LETTER";
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, y);

      y += 50;

      // Reference and date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Reference Number: ${formData.refNumber}`, margin, y);

      const formattedDate = formData.date
        ? new Date(formData.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "";
      
      doc.text(`Date: ${formattedDate}`, pageWidth - margin - 150, y);

      y += 50;

      // TO section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TO:", margin, y);

      y += 25;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("The Director General", margin, y);
      
      y += 18;
      doc.text("Federal Government of Somalia", margin, y);
      
      y += 18;
      doc.text("Immigration & Nationality Agency", margin, y);

      y += 40;

      // Subject
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y - 8, contentWidth, 25, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 100, 200);
      doc.text("SUBJECT:", margin + 10, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const subjectText = `INVITATION LETTER - ${formData.purposeOfVisit.toUpperCase()}`;
      doc.text(subjectText, margin + 80, y + 5);

      y += 40;

      // Body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      doc.text("Dear Sir/Madam,", margin, y);
      y += 25;

      const bodyLines = [
        "We would like to inform you that the below guest will be visiting Mogadishu and will be",
        "accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport.",
        "Peace Business Group will be responsible for his accommodation and safety while visiting",
        "Mogadishu.",
        "",
        "For further clarification you may contact Peace Hotel.",
        "",
        "Guest Details:"
      ];

      bodyLines.forEach(line => {
        doc.text(line, margin, y);
        y += 15;
      });

      y += 10;

      // Guest details box
      const boxHeight = 120;
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y, contentWidth, boxHeight, "F");
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(margin, y, contentWidth, boxHeight);

      const detailsStartY = y + 20;
      const leftCol = margin + 20;
      const rightCol = margin + (contentWidth / 2) + 10;

      // Left column
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      let detailY = detailsStartY;
      doc.text("Full Name:", leftCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(formData.visitorName.toUpperCase(), leftCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Nationality:", leftCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(formData.visitorNationality.toUpperCase(), leftCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Organization:", leftCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(formData.visitorOrg, leftCol, detailY);

      // Right column
      detailY = detailsStartY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Passport Number:", rightCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(formData.visitorPassport, rightCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Passport Expiry:", rightCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const passportExpiryFormatted = formData.passportExpiry
        ? new Date(formData.passportExpiry).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";
      doc.text(passportExpiryFormatted, rightCol, detailY);

      detailY += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Date of Visit:", rightCol, detailY);
      detailY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const visitDateFormatted = formData.dateOfVisit
        ? new Date(formData.dateOfVisit).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";
      doc.text(visitDateFormatted, rightCol, detailY);

      // Move Y position after the box
      y += boxHeight + 30;

      // Closing paragraph
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const closingLines = [
        "We guarantee full compliance with immigration regulations and commitment to ensuring the",
        "visitor's departure within the specified timeframe.",
        "",
        "Thank you for your consideration.",
        "",
        "Yours sincerely,"
      ];

      closingLines.forEach(line => {
        doc.text(line, margin, y);
        y += 15;
      });

      y += 20;

      // Signature section
      const signatureBoxHeight = 80;
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, signatureBoxHeight, "F");

      const sigY = y + 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Authorized Signature:", margin + 20, sigY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 100, 200);
      doc.text("Mr. Bashir Osman", margin + 20, sigY + 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Chief Executive Officer", margin + 20, sigY + 40);
      doc.text("Peace Business Group", margin + 20, sigY + 55);

      // Company stamp
      try {
        const stampBase64 = await loadImageAsBase64(STAMP_IMAGE);
        doc.addImage(stampBase64, "PNG", pageWidth - 140, sigY, 80, 80);
      } catch (stampError) {
        console.log("Stamp loading error:", stampError);
        // Fallback stamp
        const sealX = pageWidth - 100;
        const sealY = sigY + 25;
        const sealRadius = 25;

        doc.setFillColor(0, 100, 200);
        doc.circle(sealX, sealY, sealRadius, "F");

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(2);
        doc.circle(sealX, sealY, sealRadius - 3);

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.text("PEACE BUSINESS", sealX - 20, sealY - 3);
        doc.text("GROUP", sealX - 8, sealY + 4);
        doc.text("SOMALIA", sealX - 12, sealY + 11);
      }

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const verifyText = "Official document digitally generated by Peace Business Group";
      const verifyWidth = doc.getTextWidth(verifyText);
      doc.text(verifyText, (pageWidth - verifyWidth) / 2, pageHeight - 40);

      const fileName = `invitation-letter-${formData.visitorName.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}.pdf`;
      doc.save(fileName);

      // Save to history
      saveToHistory(formData, fileName);

      setLoading(false);
      toast.success("Invitation letter generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setLoading(false);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Enhanced filtering and sorting logic
  const filteredHistory = history
    .filter((item) => {
      // Text search filter
      const matchesSearch =
        !searchTerm ||
        item.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.visitor_nationality
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.ref_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.purpose_of_visit
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.visitor_organization
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Nationality filter
      const matchesNationality =
        !filters.nationality ||
        filters.nationality === "__all__" ||
        item.visitor_nationality
          .toLowerCase()
          .includes(filters.nationality.toLowerCase());

      // Purpose filter
      const matchesPurpose =
        !filters.purpose ||
        filters.purpose === "__all__" ||
        item.purpose_of_visit
          .toLowerCase()
          .includes(filters.purpose.toLowerCase());

      // Organization filter
      const matchesOrganization =
        !filters.organization ||
        filters.organization === "__all__" ||
        item.visitor_organization
          .toLowerCase()
          .includes(filters.organization.toLowerCase());

      // Date range filter
      const itemDate = new Date(item.created_at).toISOString().split("T")[0];
      const matchesDateFrom = !filters.dateFrom || itemDate >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || itemDate <= filters.dateTo;

      return (
        matchesSearch &&
        matchesNationality &&
        matchesPurpose &&
        matchesOrganization &&
        matchesDateFrom &&
        matchesDateTo
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "date_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name_asc":
          return a.visitor_name.localeCompare(b.visitor_name);
        case "name_desc":
          return b.visitor_name.localeCompare(a.visitor_name);
        default:
          return 0;
      }
    });

  // Get unique values for filter dropdowns
  const uniqueNationalities = [
    ...new Set(history.map((item) => item.visitor_nationality)),
  ].sort();
  const uniquePurposes = [
    ...new Set(history.map((item) => item.purpose_of_visit)),
  ].sort();
  const uniqueOrganizations = [
    ...new Set(history.map((item) => item.visitor_organization)),
  ].sort();

  // Clear filters function
  const clearFilters = () => {
    setFilters({
      nationality: "__all__",
      purpose: "__all__",
      dateFrom: "",
      dateTo: "",
      organization: "__all__",
    });
    setSearchTerm("");
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    Object.entries(filters).some(([key, value]) => {
      if (key === "dateFrom" || key === "dateTo") {
        return value !== "";
      }
      return value !== "" && value !== "__all__";
    });

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Card className="shadow-lg border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center mb-2 flex items-center justify-center gap-2">
            <FileText className="h-6 w-6" />
            Visa Invitation Letter Generator
          </CardTitle>
          <p className="text-muted-foreground text-center text-sm">
            Generate professional invitation letters and manage your history
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generate Letter
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            {/* Generate Letter Tab */}
            <TabsContent value="generate" className="mt-6">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                {/* Company Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyAddress">Company Address</Label>
                      <Input
                        id="companyAddress"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        value={formData.companyEmail}
                        onChange={handleInputChange}
                        type="email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Company Phone</Label>
                      <Input
                        id="companyPhone"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Reference & Date Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="refNumber">Reference Number</Label>
                    <Input
                      id="refNumber"
                      name="refNumber"
                      value={formData.refNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. PH/GM/11-4-810408"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Guest Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="visitorName">Guest Name</Label>
                      <Input
                        id="visitorName"
                        name="visitorName"
                        value={formData.visitorName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitorNationality">Nationality</Label>
                      <Input
                        id="visitorNationality"
                        name="visitorNationality"
                        value={formData.visitorNationality}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitorOrg">Organization</Label>
                      <Input
                        id="visitorOrg"
                        name="visitorOrg"
                        value={formData.visitorOrg}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitorPassport">Passport Number</Label>
                      <Input
                        id="visitorPassport"
                        name="visitorPassport"
                        value={formData.visitorPassport}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="passportExpiry">
                        Passport Expiry Date
                      </Label>
                      <Input
                        id="passportExpiry"
                        name="passportExpiry"
                        type="date"
                        value={formData.passportExpiry}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Visit Details Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">
                    Visit Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfVisit">Date of Visit</Label>
                      <Input
                        id="dateOfVisit"
                        name="dateOfVisit"
                        type="date"
                        value={formData.dateOfVisit}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="durationOfStay">Duration of Stay</Label>
                      <Input
                        id="durationOfStay"
                        name="durationOfStay"
                        value={formData.durationOfStay}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                    <Textarea
                      id="purposeOfVisit"
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleInputChange}
                      required
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <Button
                  onClick={generatePDF}
                  className="w-full text-lg py-6 mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : null}
                  Generate Invitation Letter PDF
                </Button>
              </form>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <div className="space-y-4">
                {/* Search and Filters Header */}
                <div className="flex flex-col gap-4">
                  {/* Main search and action row */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, nationality, reference, purpose, or organization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Popover open={showFilters} onOpenChange={setShowFilters}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={hasActiveFilters ? "default" : "outline"}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && (
                              <Badge
                                variant="secondary"
                                className="ml-1 text-xs"
                              >
                                Active
                              </Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Advanced Filters</h4>
                              {hasActiveFilters && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearFilters}
                                  className="text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Clear All
                                </Button>
                              )}
                            </div>

                            {/* Nationality Filter */}
                            <div>
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Nationality
                              </Label>
                              <Select
                                value={filters.nationality}
                                onValueChange={(value) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    nationality: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="All nationalities" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__all__">
                                    All nationalities
                                  </SelectItem>
                                  {uniqueNationalities.map((nationality) => (
                                    <SelectItem
                                      key={nationality}
                                      value={nationality}
                                    >
                                      {nationality}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Organization Filter */}
                            <div>
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                Organization
                              </Label>
                              <Select
                                value={filters.organization}
                                onValueChange={(value) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    organization: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="All organizations" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__all__">
                                    All organizations
                                  </SelectItem>
                                  {uniqueOrganizations.map((org) => (
                                    <SelectItem key={org} value={org}>
                                      {org}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Purpose Filter */}
                            <div>
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Purpose
                              </Label>
                              <Select
                                value={filters.purpose}
                                onValueChange={(value) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    purpose: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="All purposes" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__all__">
                                    All purposes
                                  </SelectItem>
                                  {uniquePurposes.map((purpose) => (
                                    <SelectItem key={purpose} value={purpose}>
                                      {purpose}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Date Range Filter */}
                            <div>
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Date Range
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Input
                                    type="date"
                                    placeholder="From"
                                    value={filters.dateFrom}
                                    onChange={(e) =>
                                      setFilters((prev) => ({
                                        ...prev,
                                        dateFrom: e.target.value,
                                      }))
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="date"
                                    placeholder="To"
                                    value={filters.dateTo}
                                    onChange={(e) =>
                                      setFilters((prev) => ({
                                        ...prev,
                                        dateTo: e.target.value,
                                      }))
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Select
                        value={sortBy}
                        onValueChange={(value: any) => setSortBy(value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_desc">
                            <div className="flex items-center gap-2">
                              <SortDesc className="h-3 w-3" />
                              Newest First
                            </div>
                          </SelectItem>
                          <SelectItem value="date_asc">
                            <div className="flex items-center gap-2">
                              <SortAsc className="h-3 w-3" />
                              Oldest First
                            </div>
                          </SelectItem>
                          <SelectItem value="name_asc">
                            <div className="flex items-center gap-2">
                              <SortAsc className="h-3 w-3" />
                              Name A-Z
                            </div>
                          </SelectItem>
                          <SelectItem value="name_desc">
                            <div className="flex items-center gap-2">
                              <SortDesc className="h-3 w-3" />
                              Name Z-A
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filter summary and results count */}
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {hasActiveFilters && (
                        <>
                          {searchTerm && (
                            <Badge variant="secondary" className="text-xs">
                              Search: "{searchTerm}"
                            </Badge>
                          )}
                          {filters.nationality &&
                            filters.nationality !== "__all__" && (
                              <Badge variant="secondary" className="text-xs">
                                Nationality: {filters.nationality}
                              </Badge>
                            )}
                          {filters.organization &&
                            filters.organization !== "__all__" && (
                              <Badge variant="secondary" className="text-xs">
                                Organization: {filters.organization}
                              </Badge>
                            )}
                          {filters.purpose && filters.purpose !== "__all__" && (
                            <Badge variant="secondary" className="text-xs">
                              Purpose: {filters.purpose}
                            </Badge>
                          )}
                          {(filters.dateFrom || filters.dateTo) && (
                            <Badge variant="secondary" className="text-xs">
                              Date: {filters.dateFrom || "start"} -{" "}
                              {filters.dateTo || "end"}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {filteredHistory.length} of {history.length} letters
                    </Badge>
                  </div>
                </div>

                {/* History List */}
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {history.length === 0
                        ? "No Letters Generated Yet"
                        : "No Results Found"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {history.length === 0
                        ? "Generate your first invitation letter to see it appear here."
                        : "Try adjusting your search terms."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredHistory.map((item) => (
                      <Card
                        key={item.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-lg">
                                {item.visitor_name}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {item.visitor_nationality}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div>
                                <strong>Ref:</strong> {item.ref_number}
                              </div>
                              <div>
                                <strong>Generated:</strong>{" "}
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                              <div>
                                <strong>Organization:</strong>{" "}
                                {item.visitor_organization}
                              </div>
                              <div>
                                <strong>Purpose:</strong>{" "}
                                {item.purpose_of_visit}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadFromHistory(item)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regeneratePDF(item)}
                              disabled={loading}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteFromHistory(item.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationLetter;
