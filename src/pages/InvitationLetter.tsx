import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDownloader } from "@/components/invitation-letter";
import type { InvitationLetterData } from "@/components/invitation-letter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface FormDataInterface {
  refNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  guestName: string;
  nationality: string;
  organization: string;
  passportNumber: string;
  passportExpiryDate: string;
  durationOfStay: string;
  purposeOfVisit: string;
}

function generateReferenceNumber() {
  const now = new Date();
  return `PH/GM/${now.getDate()}${now.getMonth() + 1}${String(
    now.getFullYear()
  ).slice(-2)}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

const InvitationLetter: React.FC = () => {
  const [formData, setFormData] = useState<FormDataInterface>({
    refNumber: generateReferenceNumber(),
    date: new Date().toISOString().split("T")[0],
    companyName: "PEACE BUSINESS GROUP",
    companyAddress: "Airport Road, Wadajir District, Mogadishu, Somalia",
    companyEmail: "reservations@peacebusinessgroup.com",
    companyPhone: "+252 61-94-94973 / +252 61-94-94974",
    guestName: "",
    nationality: "",
    organization: "",
    passportNumber: "",
    passportExpiryDate: "",
    durationOfStay: "",
    purposeOfVisit:
      "We would like to inform you that the below guest will be visiting Mogadishu and he will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.\n\nFor further clarification you may contact peace hotel.",
  });

  const [history, setHistory] = useState<InvitationLetterData[]>([]);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("invitationLetterHistory")
          : null;
      if (raw) {
        setHistory(JSON.parse(raw) as InvitationLetterData[]);
      }
    } catch {}
  }, []);

  const addToHistory = (entry: InvitationLetterData) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      try {
        localStorage.setItem("invitationLetterHistory", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const saveHistoryToDb = async (entry: InvitationLetterData) => {
    try {
      await (supabase as any).from("invitation_letter_history").insert([
        {
          ref_number: entry.refNumber,
          date: entry.date,
          company_name: entry.companyName,
          company_address: entry.companyAddress,
          company_phone: entry.companyPhone,
          company_email: entry.companyEmail,
          guest_name: entry.guestName,
          nationality: entry.nationality,
          organization: entry.organization,
          passport_number: entry.passportNumber,
          passport_expiry_date: entry.passportExpiryDate,
          purpose_of_visit: entry.purposeOfVisit,
          created_at: new Date().toISOString(),
        },
      ] as any);
    } catch (e) {
      console.error("Failed to save invitation history:", e);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        <div className="border-b border-border pb-4 pt-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Visa Invitation Letter Generator
            </h1>
          </div>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input
                      id="companyAddress"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone</Label>
                    <Input
                      id="companyPhone"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refNumber">Reference Number</Label>
                    <Input
                      id="refNumber"
                      name="refNumber"
                      value={formData.refNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Guest Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Guest Name</Label>
                    <Input
                      id="guestName"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input
                      id="passportNumber"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiryDate">
                      Passport Expiry Date
                    </Label>
                    <Input
                      id="passportExpiryDate"
                      type="date"
                      name="passportExpiryDate"
                      value={formData.passportExpiryDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                    <textarea
                      id="purposeOfVisit"
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleInputChange}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <PDFDownloader
                  data={formData as InvitationLetterData}
                  fileName={`invitation-letter-${formData.refNumber}.pdf`}
                  onDownloaded={async (d) => {
                    addToHistory(d);
                    await saveHistoryToDb(d);
                  }}
                >
                  <Button type="button">Download PDF</Button>
                </PDFDownloader>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Download History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No history yet.
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <div
                      key={`${item.refNumber}-${idx}`}
                      className="flex items-center justify-between gap-2 border rounded-md p-3"
                    >
                      <div className="text-sm">
                        <div className="font-medium">
                          {item.guestName || "Guest"} — {item.organization}
                        </div>
                        <div className="text-muted-foreground">
                          Ref: {item.refNumber} • Date: {new Date(item.date).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                      <PDFDownloader
                        data={item}
                        fileName={`invitation-letter-${item.refNumber}.pdf`}
                      >
                        <Button type="button" variant="outline">
                          Re-download
                        </Button>
                      </PDFDownloader>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InvitationLetter;

import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { jsPDF } from "jspdf";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import {
  FileText,
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  Loader2,
  Eye,
} from "lucide-react";
=======
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDownloader } from "@/components/invitation-letter";
import type { InvitationLetterData } from "@/components/invitation-letter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
>>>>>>> origin/main

// Keep separate from native FormData
interface FormDataInterface {
  refNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  guestName: string;
  nationality: string;
  organization: string;
  passportNumber: string;
  passportExpiryDate: string;
<<<<<<< HEAD
  visitDate: string;
  durationOfStay: string;
  purposeOfVisit: string;
}

const InvitationLetter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"generate" | "history">(
    "generate"
  );
  const [formData, setFormData] = useState<FormData>({
=======
  durationOfStay: string;
  purposeOfVisit: string;
}

function generateReferenceNumber() {
  const now = new Date();
  return `PH/GM/${now.getDate()}${now.getMonth() + 1}${String(
    now.getFullYear()
  ).slice(
    -2
  )}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

const InvitationLetter: React.FC = () => {
  const [formData, setFormData] = useState<FormDataInterface>({
>>>>>>> origin/main
    refNumber: generateReferenceNumber(),
    date: new Date().toISOString().split("T")[0],
    companyName: "PEACE BUSINESS GROUP",
    companyAddress: "Airport Road, Wadajir District, Mogadishu, Somalia",
    companyEmail: "reservations@peacebusinessgroup.com",
    companyPhone: "+252 61-94-94973 / +252 61-94-94974",
    guestName: "",
    nationality: "",
    organization: "",
    passportNumber: "",
    passportExpiryDate: "",
<<<<<<< HEAD
    visitDate: "",
    durationOfStay: "",
    purposeOfVisit: "Peace Hotel Reservation",
  });

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  function generateReferenceNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `PH/GM/${day}${month}${year}-${hours}${minutes}${seconds}-${random}`;
  }

  const loadHistory = async () => {
    try {
      if (!user?.id) {
        console.log("No user ID available, skipping history load");
        return;
      }

      const { data, error } = await supabase
        .from("invitation_letters")
        .select("*")
        .eq("generated_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("History loaded successfully:", data?.length || 0, "items");
      if (data && data.length > 0) {
        console.log("Sample history item structure:", data[0]);
      }
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
      // Don't show alert to user for history loading errors
      setHistory([]);
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Set margins and starting position - much more compact
      const margin = 15;
      let y = 25;

      // Beautiful gradient-like header with multiple elements
      // Main header background
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 35, "F");

      // Add a subtle accent line above header
      doc.setFillColor(52, 152, 219);
      doc.rect(margin, y, pageWidth - 2 * margin, 3, "F");

      // Company name in elegant white text
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(formData.companyName, pageWidth / 2, y + 20, {
        align: "center",
      });

      // Add a small decorative element
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth / 2, y + 25, 1, "F");

      y += 45;

      // Company details in a stylish box
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 25, "F");
      doc.rect(margin, y, pageWidth - 2 * margin, 25, "S");

      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.text(formData.companyAddress, pageWidth / 2, y + 8, {
        align: "center",
      });
      doc.text(formData.companyEmail, pageWidth / 2, y + 16, {
        align: "center",
      });
      doc.text(formData.companyPhone, pageWidth / 2, y + 24, {
        align: "center",
      });

      y += 35;

      // Document title with elegant styling
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text("OFFICIAL INVITATION LETTER", pageWidth / 2, y, {
        align: "center",
      });

      // Add decorative lines around title
      doc.setDrawColor(41, 128, 185);
      doc.line(pageWidth / 2 - 80, y + 5, pageWidth / 2 - 20, y + 5);
      doc.line(pageWidth / 2 + 20, y + 5, pageWidth / 2 + 80, y + 5);

      y += 25;

      // Reference and Date in a modern card layout
      doc.setFillColor(240, 244, 247);
      doc.setDrawColor(41, 128, 185);
      doc.rect(margin, y, (pageWidth - 2 * margin) / 2 - 5, 20, "F");
      doc.rect(margin, y, (pageWidth - 2 * margin) / 2 - 5, 20, "S");
      doc.rect(pageWidth / 2 + 5, y, (pageWidth - 2 * margin) / 2 - 5, 20, "F");
      doc.rect(pageWidth / 2 + 5, y, (pageWidth - 2 * margin) / 2 - 5, 20, "S");

      doc.setFontSize(10);
      doc.setTextColor(41, 128, 185);
      doc.text("REFERENCE", margin + 10, y + 8);
      doc.text("DATE", pageWidth / 2 + 15, y + 8);

      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.text(formData.refNumber, margin + 10, y + 18);
      doc.text(
        new Date(formData.date).toLocaleDateString("en-GB"),
        pageWidth / 2 + 15,
        y + 18
      );

      y += 30;

      // TO section with modern styling
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, 40, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("TO:", margin + 20, y + 10);

      y += 20;
      doc.setTextColor(52, 73, 94);
      doc.setFontSize(10);
      doc.text("The Director General", margin + 45, y);
      y += 7;
      doc.text("Federal Government of Somalia", margin + 45, y);
      y += 7;
      doc.text("Immigration & Nationality Agency", margin + 45, y);

      y += 20;

      // Subject with elegant background
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(
        "SUBJECT: INVITATION LETTER - PEACE HOTEL RESERVATION",
        pageWidth / 2,
        y + 8,
        { align: "center" }
      );

      y += 20;

      // Salutation
      doc.setTextColor(52, 73, 94);
      doc.text("Dear Sir/Madam,", margin, y);
      y += 12;

      // Body - compact
      doc.setFontSize(9);
      const bodyText = `We would like to inform you that the below guest will be visiting Mogadishu and will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.`;
      const splitBody = doc.splitTextToSize(bodyText, pageWidth - 2 * margin);
      doc.text(splitBody, margin, y);
      y += splitBody.length * 4 + 8;

      const clarificationText = `For further clarification you may contact Peace Hotel.`;
      doc.text(clarificationText, margin, y);
      y += 15;

      // Guest details in a beautiful card design
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 50, "F");
      doc.rect(margin, y, pageWidth - 2 * margin, 50, "S");

      // Card header
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("GUEST DETAILS", pageWidth / 2, y + 8, { align: "center" });

      y += 20;

      // Left column
      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.text(`Full Name: ${formData.guestName.toUpperCase()}`, margin + 8, y);
      doc.text(
        `Nationality: ${formData.nationality.toUpperCase()}`,
        margin + 8,
        y + 12
      );
      doc.text(`Organization: ${formData.organization}`, margin + 8, y + 24);

      // Right column
      doc.text(
        `Passport Number: ${formData.passportNumber}`,
        pageWidth / 2 + 5,
        y
      );
      doc.text(
        `Passport Expiry: ${formData.passportExpiryDate}`,
        pageWidth / 2 + 5,
        y + 12
      );
      doc.text(
        `Date of Visit: ${formData.visitDate}`,
        pageWidth / 2 + 5,
        y + 24
      );

      y += 60;

      // Commitment - compact
      const commitmentText = `We guarantee full compliance with immigration regulations and commitment to ensuring the visitor's departure within the specified timeframe.`;
      const splitCommitment = doc.splitTextToSize(
        commitmentText,
        pageWidth - 2 * margin
      );
      doc.text(splitCommitment, margin, y);
      y += splitCommitment.length * 4 + 12;

      // Closing
      doc.text("Thank you for your consideration.", margin, y);
      y += 15;
      doc.text("Yours sincerely,", margin, y);
      y += 15;
      doc.text("Authorized Signature:", margin, y);
      y += 12;
      doc.line(margin, y, margin + 100, y);
      y += 15;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Official document digitally generated by Peace Business Group.",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );

      // Save to Supabase
      const pdfBlob = doc.output("blob");
      const fileName = `invitation_letter_${
        formData.refNumber
      }_${Date.now()}.pdf`;

      // Upload to storage with proper folder structure for RLS
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("invitation-letters")
        .upload(`${user?.id}/${fileName}`, pdfBlob);

      if (uploadError) throw uploadError;

      // Prepare insert data
      const insertData = {
        generated_by: user?.id,
        ref_number: formData.refNumber,
        letter_date: formData.date,
        company_name: formData.companyName,
        company_address: formData.companyAddress,
        company_email: formData.companyEmail,
        company_phone: formData.companyPhone,
        visitor_name: formData.guestName,
        visitor_nationality: formData.nationality,
        visitor_organization: formData.organization,
        visitor_passport: formData.passportNumber,
        passport_expiry: formData.passportExpiryDate,
        date_of_visit: formData.visitDate,
        duration_of_stay: formData.durationOfStay,
        purpose_of_visit: formData.purposeOfVisit,
        file_name: fileName,
        pdf_url: uploadData.path,
        form_data: formData,
      };

      console.log("Attempting to insert invitation letter:", insertData);

      const { data: insertResult, error: insertError } = await supabase
        .from("invitation_letters")
        .insert(insertData);

      if (insertError) {
        console.error("Database insert error:", insertError);
        console.error("Insert data that failed:", insertData);
        console.error("Current user ID:", user?.id);
        throw insertError;
      }

      // Download the PDF
      doc.save(fileName);

      // Reload history and reset form
      await loadHistory();
      setFormData((prev) => ({
        ...prev,
        refNumber: generateReferenceNumber(),
        date: new Date().toISOString().split("T")[0],
        guestName: "",
        nationality: "",
        organization: "",
        passportNumber: "",
        passportExpiryDate: "",
        visitDate: "",
        durationOfStay: "",
      }));

      toast({
        title: "Success",
        description: "Invitation letter generated successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Error generating PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

=======
    durationOfStay: "",
    purposeOfVisit:
      "We would like to inform you that the below guest will be visiting Mogadishu and he will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.\n\nFor further clarification you may contact peace hotel.",
  });

>>>>>>> origin/main
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

<<<<<<< HEAD
  const downloadHistoryFile = async (historyItem: any) => {
    setLoading(true);
    try {
      // Generate a fresh PDF with the current design instead of downloading the old file
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Set margins and starting position - much more compact
      const margin = 15;
      let y = 25;

      // Professional letterhead design
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 25, "F");
      y += 5;

      // Company name in white on blue background
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(historyItem.company_name, pageWidth / 2, y, { align: "center" });
      y += 20;

      // Company details below the header bar
      doc.setFontSize(7);
      doc.setTextColor(52, 73, 94);
      doc.text(historyItem.company_address, pageWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.text(historyItem.company_email, pageWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.text(historyItem.company_phone, pageWidth / 2, y, {
        align: "center",
      });
      y += 12;

      // Document title
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text("OFFICIAL INVITATION LETTER", pageWidth / 2, y, {
        align: "center",
      });
      y += 20;

      // Reference and Date - side by side, compact
      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.text(`Reference Number: ${historyItem.ref_number}`, margin, y);
      doc.text(
        `Date: ${new Date(historyItem.letter_date).toLocaleDateString(
          "en-GB"
        )}`,
        pageWidth - margin - 50,
        y
      );
      y += 15;

      // TO section - compact
      doc.text("TO:", margin, y);
      y += 8;
      doc.text("The Director General", margin + 8, y);
      y += 6;
      doc.text("Federal Government of Somalia", margin + 8, y);
      y += 6;
      doc.text("Immigration & Nationality Agency", margin + 8, y);
      y += 15;

      // Subject - compact
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(
        "SUBJECT: INVITATION LETTER - PEACE HOTEL RESERVATION",
        pageWidth / 2,
        y + 6,
        { align: "center" }
      );
      y += 18;

      // Salutation
      doc.setTextColor(52, 73, 94);
      doc.text("Dear Sir/Madam,", margin, y);
      y += 12;

      // Body - compact
      doc.setFontSize(9);
      const bodyText = `We would like to inform you that the below guest will be visiting Mogadishu and will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.`;
      const splitBody = doc.splitTextToSize(bodyText, pageWidth - 2 * margin);
      doc.text(splitBody, margin, y);
      y += splitBody.length * 4 + 8;

      const clarificationText = `For further clarification you may contact Peace Hotel.`;
      doc.text(clarificationText, margin, y);
      y += 15;

      // Guest details box - compact
      doc.setFillColor(240, 244, 247);
      doc.rect(margin, y, pageWidth - 2 * margin, 45, "F");
      doc.setDrawColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 45, "S");

      doc.setFontSize(10);
      doc.setTextColor(41, 128, 185);
      doc.text("Guest Details:", margin + 8, y + 12);

      doc.setFontSize(8);
      doc.setTextColor(52, 73, 94);
      doc.text(
        `Full Name: ${historyItem.visitor_name.toUpperCase()}`,
        margin + 8,
        y + 22
      );
      doc.text(
        `Nationality: ${historyItem.visitor_nationality.toUpperCase()}`,
        margin + 8,
        y + 30
      );
      doc.text(
        `Organization: ${historyItem.visitor_organization}`,
        margin + 8,
        y + 38
      );

      doc.text(
        `Passport Number: ${historyItem.visitor_passport}`,
        pageWidth / 2 + 5,
        y + 22
      );
      doc.text(
        `Passport Expiry: ${historyItem.passport_expiry}`,
        pageWidth / 2 + 5,
        y + 30
      );
      doc.text(
        `Date of Visit: ${historyItem.date_of_visit}`,
        pageWidth / 2 + 5,
        y + 38
      );

      y += 55;

      // Commitment - compact
      const commitmentText = `We guarantee full compliance with immigration regulations and commitment to ensuring the visitor's departure within the specified timeframe.`;
      const splitCommitment = doc.splitTextToSize(
        commitmentText,
        pageWidth - 2 * margin
      );
      doc.text(splitCommitment, margin, y);
      y += splitCommitment.length * 4 + 12;

      // Closing
      doc.text("Thank you for your consideration.", margin, y);
      y += 15;
      doc.text("Yours sincerely,", margin, y);
      y += 15;
      doc.text("Authorized Signature:", margin, y);
      y += 12;
      doc.line(margin, y, margin + 100, y);
      y += 15;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Official document digitally generated by Peace Business Group.",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );

      // Download the fresh PDF with current design
      const fileName = `invitation_letter_${
        historyItem.ref_number
      }_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "Invitation letter downloaded with latest design!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Error generating PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (historyItem: any) => {
    // Populate the form with the selected history item
    setFormData({
      refNumber: historyItem.ref_number,
      date: historyItem.letter_date,
      companyName: historyItem.company_name,
      companyAddress: historyItem.company_address,
      companyEmail: historyItem.company_email,
      companyPhone: historyItem.company_phone,
      guestName: historyItem.visitor_name,
      nationality: historyItem.visitor_nationality,
      organization: historyItem.visitor_organization,
      passportNumber: historyItem.visitor_passport,
      passportExpiryDate: historyItem.passport_expiry,
      visitDate: historyItem.date_of_visit,
      durationOfStay: historyItem.duration_of_stay,
      purposeOfVisit: historyItem.purpose_of_visit,
    });

    // Switch to the generate tab to show the loaded data
    setActiveTab("generate");
  };

  const regeneratePDFFromHistory = async (historyItem: any) => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Set margins and starting position - much more compact
      const margin = 15;
      let y = 25;

      // Professional letterhead design
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 25, "F");
      y += 5;

      // Company name in white on blue background
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(historyItem.company_name, pageWidth / 2, y, { align: "center" });
      y += 20;

      // Company details below the header bar
      doc.setFontSize(7);
      doc.setTextColor(52, 73, 94);
      doc.text(historyItem.company_address, pageWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.text(historyItem.company_email, pageWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.text(historyItem.company_phone, pageWidth / 2, y, {
        align: "center",
      });
      y += 12;

      // Document title
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text("OFFICIAL INVITATION LETTER", pageWidth / 2, y, {
        align: "center",
      });
      y += 20;

      // Reference and Date - side by side, compact
      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.text(`Reference Number: ${historyItem.ref_number}`, margin, y);
      doc.text(
        `Date: ${new Date(historyItem.letter_date).toLocaleDateString(
          "en-GB"
        )}`,
        pageWidth - margin - 50,
        y
      );
      y += 15;

      // TO section - compact
      doc.text("TO:", margin, y);
      y += 8;
      doc.text("The Director General", margin + 8, y);
      y += 6;
      doc.text("Federal Government of Somalia", margin + 8, y);
      y += 6;
      doc.text("Immigration & Nationality Agency", margin + 8, y);
      y += 15;

      // Subject - compact
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(
        "SUBJECT: INVITATION LETTER - PEACE HOTEL RESERVATION",
        pageWidth / 2,
        y + 6,
        { align: "center" }
      );
      y += 18;

      // Salutation
      doc.setTextColor(52, 73, 94);
      doc.text("Dear Sir/Madam,", margin, y);
      y += 12;

      // Body - compact
      doc.setFontSize(9);
      const bodyText = `We would like to inform you that the below guest will be visiting Mogadishu and will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.`;
      const splitBody = doc.splitTextToSize(bodyText, pageWidth - 2 * margin);
      doc.text(splitBody, margin, y);
      y += splitBody.length * 4 + 8;

      const clarificationText = `For further clarification you may contact Peace Hotel.`;
      doc.text(clarificationText, margin, y);
      y += 15;

      // Guest details box - compact
      doc.setFillColor(240, 244, 247);
      doc.rect(margin, y, pageWidth - 2 * margin, 45, "F");
      doc.setDrawColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 45, "S");

      doc.setFontSize(10);
      doc.setTextColor(41, 128, 185);
      doc.text("Guest Details:", margin + 8, y + 12);

      doc.setFontSize(8);
      doc.setTextColor(52, 73, 94);
      doc.text(
        `Full Name: ${historyItem.visitor_name.toUpperCase()}`,
        margin + 8,
        y + 22
      );
      doc.text(
        `Nationality: ${historyItem.visitor_nationality.toUpperCase()}`,
        margin + 8,
        y + 30
      );
      doc.text(
        `Organization: ${historyItem.visitor_organization}`,
        margin + 8,
        y + 38
      );

      doc.text(
        `Passport Number: ${historyItem.visitor_passport}`,
        pageWidth / 2 + 5,
        y + 22
      );
      doc.text(
        `Passport Expiry: ${historyItem.passport_expiry}`,
        pageWidth / 2 + 5,
        y + 30
      );
      doc.text(
        `Date of Visit: ${historyItem.date_of_visit}`,
        pageWidth / 2 + 5,
        y + 38
      );

      y += 55;

      // Commitment - compact
      const commitmentText = `We guarantee full compliance with immigration regulations and commitment to ensuring the visitor's departure within the specified timeframe.`;
      const splitCommitment = doc.splitTextToSize(
        commitmentText,
        pageWidth - 2 * margin
      );
      doc.text(splitCommitment, margin, y);
      y += splitCommitment.length * 4 + 12;

      // Closing
      doc.text("Thank you for your consideration.", margin, y);
      y += 15;
      doc.text("Yours sincerely,", margin, y);
      y += 15;
      doc.text("Authorized Signature:", margin, y);
      y += 12;
      doc.line(margin, y, margin + 100, y);
      y += 15;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Official document digitally generated by Peace Business Group.",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );

      // Download the regenerated PDF
      const fileName = `invitation_letter_${
        historyItem.ref_number
      }_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "Invitation letter regenerated successfully!",
      });
    } catch (error) {
      console.error("Error regenerating PDF:", error);
      toast({
        title: "Error",
        description: "Error regenerating PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from("invitation_letters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadHistory();
      toast({
        title: "Success",
        description: "Invitation letter deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting invitation letter:", error);
      toast({
        title: "Error",
        description: "Error deleting invitation letter. Please try again.",
        variant: "destructive",
      });
=======
  const [history, setHistory] = useState<InvitationLetterData[]>([]);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("invitationLetterHistory")
          : null;
      if (raw) {
        setHistory(JSON.parse(raw) as InvitationLetterData[]);
      }
    } catch {}
  }, []);

  const addToHistory = (entry: InvitationLetterData) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      try {
        localStorage.setItem("invitationLetterHistory", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const saveHistoryToDb = async (entry: InvitationLetterData) => {
    try {
      await (supabase as any).from("invitation_letter_history").insert([
        {
          ref_number: entry.refNumber,
          date: entry.date,
          company_name: entry.companyName,
          company_address: entry.companyAddress,
          company_phone: entry.companyPhone,
          company_email: entry.companyEmail,
          guest_name: entry.guestName,
          nationality: entry.nationality,
          organization: entry.organization,
          passport_number: entry.passportNumber,
          passport_expiry_date: entry.passportExpiryDate,
          purpose_of_visit: entry.purposeOfVisit,
          created_at: new Date().toISOString(),
        },
      ] as any);
    } catch (e) {
      console.error("Failed to save invitation history:", e);
>>>>>>> origin/main
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deleteHistoryItem(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      item.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.visitor_nationality
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.ref_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.purpose_of_visit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.visitor_organization
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortOrder === "newest") {
  return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  });

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">
          Visa Invitation Letter Generator
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Generate professional invitation letters and manage your history.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "generate"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Generate Letter
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "history"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {activeTab === "generate" ? (
          /* Generate Letter Form */
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generatePDF();
              }}
              className="space-y-6"
            >
              {/* Company Information */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Address
                    </label>
                    <input
                      type="text"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Email
                    </label>
                    <input
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Phone
                    </label>
                    <input
                      type="tel"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="refNumber"
                      value={formData.refNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">
                  Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Passport Expiry Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="passportExpiryDate"
                        value={formData.passportExpiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date of Visit
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="visitDate"
                        value={formData.visitDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duration of Stay
                    </label>
                    <input
                      type="text"
                      name="durationOfStay"
                      value={formData.durationOfStay}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Purpose of Visit
                    </label>
                    <textarea
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Invitation Letter PDF"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* History Section */
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, nationality, reference, purpose, or organization"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "newest" | "oldest")
                  }
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-slate-400 mb-4">
              {sortedHistory.length} of {history.length} letters
            </div>

            {/* History Items */}
            {sortedHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">
                  {searchTerm
                    ? "No letters found matching your search."
                    : "No invitation letters generated yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-700 p-4 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white text-lg">
                            {item.visitor_name}
                          </h3>
                          {item.visitor_nationality && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              {item.visitor_nationality}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 space-y-1">
                          <p>
                            <span className="text-slate-400">Ref:</span>{" "}
                            {item.ref_number}
                          </p>
                          <p>
                            <span className="text-slate-400">
                              Organization:
                            </span>{" "}
                            {item.visitor_organization || "N/A"}
                          </p>
                          <p>
                            <span className="text-slate-400">Generated:</span>{" "}
                            {new Date(item.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <p>
                            <span className="text-slate-400">Purpose:</span>{" "}
                            {item.purpose_of_visit || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadHistoryItem(item)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Load
                        </button>

                        {item.pdf_url ? (
                          <button
                            onClick={() => downloadHistoryFile(item)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-2 bg-gray-500 text-gray-300 rounded-lg cursor-not-allowed flex items-center gap-2"
                            title="No PDF file available"
                          >
                            <Download className="w-4 h-4" />
                            No File
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete(item.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Delete Invitation Letter
                </h3>
                <p className="text-slate-300 mb-6">
                  Are you sure you want to delete this invitation letter? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
=======
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        <div className="border-b border-border pb-4 pt-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Visa Invitation Letter Generator
            </h1>
          </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <form className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Input
                    id="companyAddress"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refNumber">Reference Number</Label>
                  <Input
                    id="refNumber"
                    name="refNumber"
                    value={formData.refNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    name="guestName"
                    value={formData.guestName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportExpiryDate">
                    Passport Expiry Date
                  </Label>
                  <Input
                    id="passportExpiryDate"
                    type="date"
                    name="passportExpiryDate"
                    value={formData.passportExpiryDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                  <textarea
                    id="purposeOfVisit"
                    name="purposeOfVisit"
                    value={formData.purposeOfVisit}
                    onChange={handleInputChange}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <PDFDownloader
                data={formData as InvitationLetterData}
                fileName={`invitation-letter-${formData.refNumber}.pdf`}
                onDownloaded={async (d) => {
                  addToHistory(d);
                  await saveHistoryToDb(d);
                }}
              >
                <Button type="button">Download PDF</Button>
              </PDFDownloader>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Download History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No history yet.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={`${item.refNumber}-${idx}`}
                    className="flex items-center justify-between gap-2 border rounded-md p-3"
                  >
                    <div className="text-sm">
                      <div className="font-medium">
                        {item.guestName || "Guest"} — {item.organization}
                      </div>
                      <div className="text-muted-foreground">
                        Ref: {item.refNumber} • Date:{" "}
                        {new Date(item.date).toLocaleDateString("en-GB")}
                      </div>
                    </div>
                    <PDFDownloader
                      data={item}
                      fileName={`invitation-letter-${item.refNumber}.pdf`}
                    >
                      <Button type="button" variant="outline">
                        Re-download
                      </Button>
                    </PDFDownloader>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
>>>>>>> origin/main
      </div>
    </div>
  );
};

export default InvitationLetter;
