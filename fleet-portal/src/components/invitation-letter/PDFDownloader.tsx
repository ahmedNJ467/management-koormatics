"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import type { InvitationLetterData } from "./types";

interface PDFDownloaderProps {
  data: InvitationLetterData;
  fileName?: string;
  children?: React.ReactNode;
  onDownloaded?: (data: InvitationLetterData, fileName: string) => void;
}

// ✅ Professional minimalist PDF with logo + table
const generateMinimalistPDF = async (data: InvitationLetterData) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Helpers
  const loadImageAsDataUrl = async (path: string): Promise<string | null> => {
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const formatDisplayDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}, ${year}`;
  };

  const formatPassportExp = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  // Colors
  const blue: [number, number, number] = [43, 108, 176];
  const gray: [number, number, number] = [110, 110, 110];

  // Letterhead: logo left, company details right
  const logo = await loadImageAsDataUrl("/images/pbg.jpg");
  if (logo) {
    doc.addImage(logo, "JPEG", margin, y - 8, 35, 32);
  }
  doc.setTextColor(blue[0], blue[1], blue[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text("PEACE BUSINESS GROUP", pageWidth - margin, y + 2, {
    align: "right",
  });
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  const companyLines = [
    data.companyAddress,
    data.companyEmail,
    data.companyPhone,
  ].filter(Boolean) as string[];
  let ty = y + 8;
  for (const line of companyLines) {
    doc.text(line, pageWidth - margin, ty, { align: "right" });
    ty += 4;
  }
  // Divider under letterhead - pushed down to accommodate logo
  y = Math.max(y + 32 - 6, ty - 4); // Extremely tight spacing
  doc.setDrawColor(220);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  // Title centered
  doc.setTextColor(0);
  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.text("OFFICIAL INVITATION LETTER", pageWidth / 2, y, { align: "center" });
  y += 8;
  // Ref and Date row
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  const dateStr = data.date
    ? formatDisplayDate(data.date)
    : formatDisplayDate(new Date().toISOString());
  doc.text("Ref:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(` ${data.refNumber}`, margin + doc.getTextWidth("Ref:"), y);
  doc.setFont(undefined, "bold");
  const rightLabel = "Date:";
  const rlw = doc.getTextWidth(rightLabel);
  const rightX = pageWidth - margin - rlw - doc.getTextWidth(` ${dateStr}`);
  doc.text(rightLabel, rightX, y);
  doc.setFont(undefined, "normal");
  doc.text(` ${dateStr}`, rightX + rlw, y);
  y += 10;

  // Recipient address
  y += 4;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("To:", margin, y);
  y += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text("Federal Government of Somalia", margin, y);
  y += 4;
  doc.text("Immigration & Nationality Department", margin, y);
  y += 4;
  doc.text("Mogadishu, Somalia", margin, y);
  y += 8;

  // Salutation
  doc.setFontSize(10);
  doc.text("Dear Sir/Madam,", margin, y);
  y += 8;

  // Subject line
  doc.setFont(undefined, "bold");
  const subjectText = data.subject || "Official Invitation for Business Visit";
  doc.text(`Subject: ${subjectText}`, margin, y);
  y += 8;

  // Body text processing
  doc.setFont(undefined, "normal");
  let bodyText =
    data.purposeOfVisit ||
    "We would like to inform you that the below guest will be visiting Mogadishu and he will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.\n\nWe kindly request your assistance in facilitating the necessary visa and entry procedures for the above-mentioned guest. Should you require any additional information or documentation, please do not hesitate to contact our office.\n\nWe look forward to your favorable consideration.";

  // Split body text into paragraphs
  const paragraphs = bodyText.split("\n\n");
  let firstParagraph = paragraphs[0] || "";

  // Find the request paragraph (contains "We kindly request")
  let requestParagraph = "";
  let requestParagraphIndex = -1;
  for (let i = 1; i < paragraphs.length; i++) {
    if (paragraphs[i].includes("We kindly request")) {
      requestParagraph = paragraphs[i];
      requestParagraphIndex = i;
      break;
    }
  }

  // If no request paragraph found, use default
  if (!requestParagraph) {
    requestParagraph =
      "We kindly request your assistance in facilitating the necessary visa and entry procedures for the above-mentioned guest. Should you require any additional information or documentation, please do not hesitate to contact us.\n\nWe look forward to your favorable consideration.";
  }

  // First paragraph
  const firstParagraphLines = doc.splitTextToSize(
    firstParagraph,
    pageWidth - 2 * margin
  );
  doc.text(firstParagraphLines, margin, y);
  y += firstParagraphLines.length * 4.5;

  // Guest details table
  const tableHead = [
    [
      "NAME",
      "NATIONALITY",
      "ORGANIZATION",
      "PASSPORT NO.",
      "PASSPORT EXPIRY DATE",
    ],
  ];
  const tableBody = [
    [
      data.guestName || "",
      data.nationality || "",
      data.organization || "",
      data.passportNumber || "",
      formatPassportExp(data.passportExpiryDate),
    ],
  ];

  (autoTable as any)(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [247, 248, 250], textColor: 0 },
    theme: "grid",
    margin: { left: margin, right: margin },
  });

  // Move y to after table
  y = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 6
    : y + 20;

  // Request paragraph
  const requestParagraphLines = doc.splitTextToSize(
    requestParagraph,
    pageWidth - 2 * margin
  );
  doc.text(requestParagraphLines, margin, y);
  y += requestParagraphLines.length * 4.5 + 8;

  // Closing and signature
  doc.setFontSize(10);
  doc.text("Yours sincerely,", margin, y);
  y += 6;
  doc.text("Bashir Osman", margin, y);
  y += 5;
  doc.text("Chief Executive Officer", margin, y);
  y += 4;
  doc.text("Peace Business Group", margin, y);
  // Place larger stamp & signature just below the closing text
  y += 4;
  try {
    const signImg = await loadImageAsDataUrl("/images/Stamp & Signature.png");
    if (signImg) {
      const imgWidth = 130;
      const imgHeight = 76;
      // align under the text, slightly indented
      doc.addImage(signImg, "PNG", margin + 20, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    } else {
      y += 12;
    }
  } catch {
    y += 12;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120);
  const footer = [
    "Peace Hotels, Mogadishu Somalia +252619494973 / +252619494974",
    "reservations@peacebusinessgroup.com or movcon@peacebusinessgroup.com",
    "Close to Adan Cade International Airport, Wadajir-Mogadishu",
  ];
  const baseY = doc.internal.pageSize.getHeight() - 18;
  let fy = baseY;
  for (const line of footer) {
    doc.text(line, pageWidth / 2, fy, { align: "center" });
    fy += 4;
  }

  return doc;
};

const PDFDownloader: React.FC<PDFDownloaderProps> = ({
  data,
  fileName = "invitation-letter.pdf",
  children,
  onDownloaded,
}) => {
  const handleDownload = async () => {
    const doc = await generateMinimalistPDF(data);
    doc.save(fileName);
    if (onDownloaded) {
      onDownloaded(data, fileName);
    }
  };

  return (
    <div onClick={handleDownload}>
      {children || (
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      )}
    </div>
  );
};

export default PDFDownloader;
