import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";

interface FormData {
  refNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  visitorName: string;
  visitorCompany: string;
  visitorDesignation: string;
  visitDate: string;
  visitTime: string;
  visitPurpose: string;
  meetingLocation: string;
  contactPerson: string;
}

const InvitationLetter: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    refNumber: "",
    date: "",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    visitorName: "",
    visitorCompany: "",
    visitorDesignation: "",
    visitDate: "",
    visitTime: "",
    visitPurpose: "",
    meetingLocation: "",
    contactPerson: "",
  });

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("invitation_letters")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const loadImageAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Set margins and starting position
      const margin = 80;
      let y = 90;

      // Professional color scheme
      const primaryColor = [41, 128, 185]; // Blue
      const secondaryColor = [52, 73, 94]; // Dark gray
      const accentColor = [52, 152, 219]; // Light blue
      const textColor = [44, 62, 80]; // Dark text
      const lightGray = [236, 240, 241]; // Light gray
      const borderColor = [189, 195, 199]; // Border gray

      // Add watermark pattern
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.1);
      for (let i = 0; i < pageWidth; i += 20) {
        doc.line(i, 0, i + 20, pageHeight);
      }
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Add document border
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(1);
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

      // Header
      if (logoFile) {
        try {
          const logoBase64 = await loadImageAsBase64(logoFile);
          doc.addImage(logoBase64, "JPEG", margin, y, 30, 30);
          y += 35;
        } catch (error) {
          console.error("Error loading logo:", error);
          y += 35;
        }
      } else {
        y += 35;
      }

      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(formData.companyName, pageWidth / 2, y, { align: "center" });
      y += 30;

      // Header line separator
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 45;

      // Document title
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      // Decorative lines around title
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.3);
      doc.line(margin + 20, y - 5, margin + 60, y - 5);
      doc.line(pageWidth - margin - 60, y - 5, pageWidth - margin - 20, y - 5);

      doc.text("INVITATION LETTER", pageWidth / 2, y, { align: "center" });
      y += 70;

      // Reference and Date section
      const refDateBoxHeight = 60;
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(
        margin,
        y,
        pageWidth - 2 * margin,
        refDateBoxHeight,
        3,
        3,
        "FD"
      );

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("REF:", margin + 15, y + 20);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(11);
      doc.text(formData.refNumber, margin + 35, y + 20);

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("DATE:", margin + 15, y + 40);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(11);
      doc.text(
        new Date(formData.date).toLocaleDateString(),
        margin + 35,
        y + 40
      );

      y += refDateBoxHeight + 40;

      // TO section
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TO:", margin, y);
      y += 30;

      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(formData.visitorName, margin + 10, y);
      y += 25;
      doc.text(formData.visitorCompany, margin + 10, y);
      y += 25;
      doc.text(formData.visitorDesignation, margin + 10, y);
      y += 50;

      // Salutation
      doc.text("Dear " + formData.visitorName + ",", margin, y);
      y += 30;

      // Body text
      doc.setFontSize(11);
      const bodyText = `We are pleased to invite you to visit our company on ${formData.visitDate} at ${formData.visitTime}. The purpose of your visit is ${formData.visitPurpose}.`;

      const splitBody = doc.splitTextToSize(bodyText, pageWidth - 2 * margin);
      doc.text(splitBody, margin, y);
      y += splitBody.length * 16 + 20;

      // Guest details box
      const boxHeight = 160;
      const veryLightBlueGray = [240, 244, 247];
      doc.setFillColor(
        veryLightBlueGray[0],
        veryLightBlueGray[1],
        veryLightBlueGray[2]
      );
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(2);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, boxHeight, 5, 5, "FD");

      // Inner border
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(
        margin + 2,
        y + 2,
        pageWidth - 2 * margin - 4,
        boxHeight - 4,
        3,
        3,
        "S"
      );

      const detailsStartY = y + 25;
      const leftCol = margin + 20;
      const rightCol = pageWidth / 2 + 20;

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("VISIT DETAILS:", margin + 15, detailsStartY);

      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      let currentY = detailsStartY + 20;
      doc.text("Visit Date:", leftCol, currentY);
      doc.text(formData.visitDate, leftCol + 50, currentY);
      currentY += 30;

      doc.text("Visit Time:", leftCol, currentY);
      doc.text(formData.visitTime, leftCol + 50, currentY);
      currentY += 30;

      doc.text("Purpose:", leftCol, currentY);
      doc.text(formData.visitPurpose, leftCol + 50, currentY);
      currentY += 30;

      doc.text("Location:", leftCol, currentY);
      doc.text(formData.meetingLocation, leftCol + 50, currentY);
      currentY += 30;

      doc.text("Contact Person:", leftCol, currentY);
      doc.text(formData.contactPerson, leftCol + 50, currentY);

      y += boxHeight + 50;

      // Closing paragraph
      const closingText = `We look forward to your visit and hope this meeting will be beneficial for both parties. Please confirm your attendance by contacting us at ${formData.companyPhone} or ${formData.companyEmail}.`;

      const splitClosing = doc.splitTextToSize(
        closingText,
        pageWidth - 2 * margin
      );
      doc.text(splitClosing, margin, y);
      y += splitClosing.length * 18 + 30;

      // Signature section
      const signatureBoxHeight = 120;
      const veryLightBlue = [235, 245, 251];
      doc.setFillColor(veryLightBlue[0], veryLightBlue[1], veryLightBlue[2]);
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(1.5);
      doc.roundedRect(
        margin,
        y,
        pageWidth - 2 * margin,
        signatureBoxHeight,
        5,
        5,
        "FD"
      );

      const sigY = y + 30;

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Sincerely,", margin + 20, sigY);

      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(formData.contactPerson, margin + 20, sigY + 30);
      doc.text(formData.companyName, margin + 20, sigY + 50);
      doc.text(formData.companyAddress, margin + 20, sigY + 70);

      // Company stamp
      if (stampFile) {
        try {
          const stampBase64 = await loadImageAsBase64(stampFile);
          doc.addImage(
            stampBase64,
            "JPEG",
            pageWidth - margin - 60,
            sigY + 15,
            50,
            50
          );
        } catch (error) {
          console.error("Error loading stamp:", error);
          // Enhanced fallback stamp
          doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.circle(pageWidth - margin - 35, sigY + 40, 25, "F");
          doc.setFillColor(255, 255, 255);
          doc.circle(pageWidth - margin - 35, sigY + 40, 20, "F");
          doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.circle(pageWidth - margin - 35, sigY + 40, 15, "F");
          doc.setFillColor(255, 255, 255);
          doc.circle(pageWidth - margin - 35, sigY + 40, 10, "F");

          doc.setFontSize(8);
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text("STAMP", pageWidth - margin - 35, sigY + 40, {
            align: "center",
          });
        }
      } else {
        // Enhanced fallback stamp
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.circle(pageWidth - margin - 35, sigY + 15, 25, "F");
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth - margin - 35, sigY + 15, 20, "F");
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.circle(pageWidth - margin - 35, sigY + 15, 15, "F");
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth - margin - 35, sigY + 15, 10, "F");

        doc.setFontSize(8);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text("STAMP", pageWidth - margin - 35, sigY + 15, {
          align: "center",
        });
      }

      y += signatureBoxHeight + 40;

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 80,
        { align: "center" }
      );
      doc.text(
        "This is a computer-generated document",
        pageWidth / 2,
        pageHeight - 65,
        { align: "center" }
      );
      doc.text("No signature required", pageWidth / 2, pageHeight - 50, {
        align: "center",
      });

      // Save to Supabase
      const pdfBlob = doc.output("blob");
      const fileName = `invitation_letter_${
        formData.refNumber
      }_${Date.now()}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("invitation-letters")
        .upload(fileName, pdfBlob);

      if (uploadError) throw uploadError;

      const { data: insertData, error: insertError } = await supabase
        .from("invitation_letters")
        .insert({
          user_id: user?.id,
          ref_number: formData.refNumber,
          date: formData.date,
          company_name: formData.companyName,
          visitor_name: formData.visitorName,
          visit_date: formData.visitDate,
          file_path: uploadData.path,
          file_name: fileName,
        });

      if (insertError) throw insertError;

      // Download the PDF
      doc.save(fileName);

      // Reload history
      await loadHistory();

      alert("Invitation letter generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const regeneratePDF = async (historyItem: any) => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Set margins and starting position
      const margin = 80;
      let y = 90;

      // Professional color scheme
      const primaryColor = [41, 128, 185]; // Blue
      const secondaryColor = [52, 73, 94]; // Dark gray
      const accentColor = [52, 152, 219]; // Light blue
      const textColor = [44, 62, 80]; // Dark text
      const lightGray = [236, 240, 241]; // Light gray
      const borderColor = [189, 195, 199]; // Border gray

      // Add watermark pattern
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.1);
      for (let i = 0; i < pageWidth; i += 20) {
        doc.line(i, 0, i + 20, pageHeight);
      }
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Add document border
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(1);
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

      // Header
      if (logoFile) {
        try {
          const logoBase64 = await loadImageAsBase64(logoFile);
          doc.addImage(logoBase64, "JPEG", margin, y, 30, 30);
          y += 35;
        } catch (error) {
          console.error("Error loading logo:", error);
          y += 35;
        }
      } else {
        y += 35;
      }

      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(historyItem.company_name, pageWidth / 2, y, { align: "center" });
      y += 30;

      // Header line separator
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 45;

      // Document title
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      // Decorative lines around title
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.3);
      doc.line(margin + 20, y - 5, margin + 60, y - 5);
      doc.line(pageWidth - margin - 60, y - 5, pageWidth - margin - 20, y - 5);

      doc.text("INVITATION LETTER", pageWidth / 2, y, { align: "center" });
      y += 70;

      // Reference and Date section
      const refDateBoxHeight = 60;
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(
        margin,
        y,
        pageWidth - 2 * margin,
        refDateBoxHeight,
        3,
        3,
        "FD"
      );

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("REF:", margin + 15, y + 20);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(11);
      doc.text(historyItem.ref_number, margin + 35, y + 20);

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("DATE:", margin + 15, y + 40);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(11);
      doc.text(
        new Date(historyItem.date).toLocaleDateString(),
        margin + 35,
        y + 40
      );

      y += refDateBoxHeight + 40;

      // TO section
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TO:", margin, y);
      y += 30;

      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(historyItem.visitor_name, margin + 10, y);
      y += 25;
      doc.text(historyItem.visitor_company || "N/A", margin + 10, y);
      y += 25;
      doc.text(historyItem.visitor_designation || "N/A", margin + 10, y);
      y += 50;

      // Salutation
      doc.text("Dear " + historyItem.visitor_name + ",", margin, y);
      y += 30;

      // Body text
      doc.setFontSize(11);
      const bodyText = `We are pleased to invite you to visit our company on ${
        historyItem.visit_date
      } at ${historyItem.visit_time || "TBD"}. The purpose of your visit is ${
        historyItem.visit_purpose || "business meeting"
      }.`;

      const splitBody = doc.splitTextToSize(bodyText, pageWidth - 2 * margin);
      doc.text(splitBody, margin, y);
      y += splitBody.length * 16 + 20;

      // Guest details box
      const boxHeight = 160;
      const veryLightBlueGray = [240, 244, 247];
      doc.setFillColor(
        veryLightBlueGray[0],
        veryLightBlueGray[1],
        veryLightBlueGray[2]
      );
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(2);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, boxHeight, 5, 5, "FD");

      // Inner border
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(
        margin + 2,
        y + 2,
        pageWidth - 2 * margin - 4,
        boxHeight - 4,
        3,
        3,
        "S"
      );

      const detailsStartY = y + 25;
      const leftCol = margin + 20;
      const rightCol = pageWidth / 2 + 20;

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("VISIT DETAILS:", margin + 15, detailsStartY);

      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      let currentY = detailsStartY + 20;
      doc.text("Visit Date:", leftCol, currentY);
      doc.text(historyItem.visit_date, leftCol + 50, currentY);
      currentY += 30;

      doc.text("Visit Time:", leftCol, currentY);
      doc.text(historyItem.visit_time || "TBD", leftCol + 50, currentY);
      currentY += 30;

      doc.text("Purpose:", leftCol, currentY);
      doc.text(
        historyItem.visit_purpose || "Business Meeting",
        leftCol + 50,
        currentY
      );
      currentY += 30;

      doc.text("Location:", leftCol, currentY);
      doc.text(
        historyItem.meeting_location || "Main Office",
        leftCol + 50,
        currentY
      );
      currentY += 30;

      doc.text("Contact Person:", leftCol, currentY);
      doc.text(historyItem.contact_person || "N/A", leftCol + 50, currentY);

      y += boxHeight + 50;

      // Closing paragraph
      const closingText = `We look forward to your visit and hope this meeting will be beneficial for both parties. Please confirm your attendance by contacting us at ${
        historyItem.company_phone || "N/A"
      } or ${historyItem.company_email || "N/A"}.`;

      const splitClosing = doc.splitTextToSize(
        closingText,
        pageWidth - 2 * margin
      );
      doc.text(splitClosing, margin, y);
      y += splitClosing.length * 18 + 30;

      // Signature section
      const signatureBoxHeight = 120;
      const veryLightBlue = [235, 245, 251];
      doc.setFillColor(veryLightBlue[0], veryLightBlue[1], veryLightBlue[2]);
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(1.5);
      doc.roundedRect(
        margin,
        y,
        pageWidth - 2 * margin,
        signatureBoxHeight,
        5,
        5,
        "FD"
      );

      const sigY = y + 30;

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Sincerely,", margin + 20, sigY);

      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(
        historyItem.contact_person || "Company Representative",
        margin + 20,
        sigY + 30
      );
      doc.text(historyItem.company_name, margin + 20, sigY + 50);
      doc.text(
        historyItem.company_address || "Company Address",
        margin + 20,
        sigY + 70
      );

      // Company stamp
      if (stampFile) {
        try {
          const stampBase64 = await loadImageAsBase64(stampFile);
          doc.addImage(
            stampBase64,
            "JPEG",
            pageWidth - margin - 60,
            sigY + 15,
            50,
            50
          );
        } catch (error) {
          console.error("Error loading stamp:", error);
          // Enhanced fallback stamp
          doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.circle(pageWidth - margin - 35, sigY + 15, 25, "F");
          doc.setFillColor(255, 255, 255);
          doc.circle(pageWidth - margin - 35, sigY + 15, 20, "F");
          doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.circle(pageWidth - margin - 35, sigY + 15, 15, "F");
          doc.setFillColor(255, 255, 255);
          doc.circle(pageWidth - margin - 35, sigY + 15, 10, "F");

          doc.setFontSize(8);
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text("STAMP", pageWidth - margin - 35, sigY + 15, {
            align: "center",
          });
        }
      } else {
        // Enhanced fallback stamp
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.circle(pageWidth - margin - 35, sigY + 15, 25, "F");
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth - margin - 35, sigY + 15, 20, "F");
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.circle(pageWidth - margin - 35, sigY + 15, 15, "F");
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth - margin - 35, sigY + 15, 10, "F");

        doc.setFontSize(8);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text("STAMP", pageWidth - margin - 35, sigY + 15, {
          align: "center",
        });
      }

      y += signatureBoxHeight + 40;

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 80,
        { align: "center" }
      );
      doc.text(
        "This is a computer-generated document",
        pageWidth / 2,
        pageHeight - 65,
        { align: "center" }
      );
      doc.text("No signature required", pageWidth / 2, pageHeight - 50, {
        align: "center",
      });

      // Download the PDF
      const fileName = `invitation_letter_${
        historyItem.ref_number
      }_${Date.now()}.pdf`;
      doc.save(fileName);

      alert("Invitation letter regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating PDF:", error);
      alert("Error regenerating PDF. Please try again.");
    } finally {
      setLoading(false);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStampFile(e.target.files[0]);
    }
  };

  const downloadHistoryFile = async (historyItem: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("invitation-letters")
        .download(historyItem.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = historyItem.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    }
  };

  const deleteHistoryItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this invitation letter?"))
      return;

    try {
      const { error } = await supabase
        .from("invitation_letters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadHistory();
      alert("Invitation letter deleted successfully!");
    } catch (error) {
      console.error("Error deleting invitation letter:", error);
      alert("Error deleting invitation letter. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Generate Invitation Letter
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              generatePDF();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="refNumber"
                  value={formData.refNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitor Name
                </label>
                <input
                  type="text"
                  name="visitorName"
                  value={formData.visitorName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitor Company
                </label>
                <input
                  type="text"
                  name="visitorCompany"
                  value={formData.visitorCompany}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitor Designation
                </label>
                <input
                  type="text"
                  name="visitorDesignation"
                  value={formData.visitorDesignation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Date
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Time
                </label>
                <input
                  type="time"
                  name="visitTime"
                  value={formData.visitTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Location
                </label>
                <input
                  type="text"
                  name="meetingLocation"
                  value={formData.meetingLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Purpose
                </label>
                <textarea
                  name="visitPurpose"
                  value={formData.visitPurpose}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Stamp (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStampChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate PDF"}
              </button>
            </div>
          </form>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Generated Letters History
          </h2>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No invitation letters generated yet.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Ref: {item.ref_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.visitor_name} - {item.company_name} -{" "}
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadHistoryFile(item)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Download
                    </button>

                    <button
                      onClick={() => regeneratePDF(item)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Regenerate
                    </button>

                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationLetter;
