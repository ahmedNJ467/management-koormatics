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
  let y = 12;

  // Colors
  const blue: [number, number, number] = [43, 108, 176];
  const gray: [number, number, number] = [110, 110, 110];

  // Letterhead: logo left, company details right
  const logo = await loadImageAsDataUrl("/images/pbg.jpg");
  if (logo) {
    doc.addImage(logo, "JPEG", margin, y, 26, 26);
  }
  doc.setTextColor(blue[0], blue[1], blue[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text("PEACE BUSINESS GROUP", pageWidth - margin, y + 6, {
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
  let ty = y + 12;
  for (const line of companyLines) {
    doc.text(line, pageWidth - margin, ty, { align: "right" });
    ty += 4;
  }
  // Divider under letterhead
  y = Math.max(y + 30, ty + 4);
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

  // Section heading
  y += 4;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("FGS Immigration & Nationality", margin, y);
  y += 6;

  // Purpose line
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  const purposeTitle = "Purpose: Peace Hotel Reservation";
  doc.text(purposeTitle, margin, y);
  // underline
  const ptw = doc.getTextWidth(purposeTitle);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.5, margin + ptw, y + 1.5);
  y += 8;

  // Body paragraph (from purposeOfVisit field)
  const clarificationLine =
    "For further clarification you may contact peace hotel.";
  let body =
    data.purposeOfVisit ||
    "We would like to inform you that the below guest will be visiting Mogadishu and will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for her accommodation and safety while visiting Mogadishu.";
  // Remove clarification line from body if present; we will place it below the table
  body = body
    .replace(/\s*For further clarification you may contact peace hotel\.?/i, "")
    .trim();
  const bodyLines = doc.splitTextToSize(body, pageWidth - 2 * margin);
  doc.text(bodyLines, margin, y);
  y += bodyLines.length * 4.5 + 4;

  // Guest details table
  const tableHead = [
    ["NO", "NAME", "NATIONALITY", "ORG", "PASSPORT NO.", "PASSPORT EXP DATE"],
  ];
  const tableBody = [
    [
      "1",
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
  // @ts-expect-error plugin augments
  y = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 10
    : y + 30;

  // Clarification line placed below the table
  doc.setFontSize(10);
  doc.text(clarificationLine, margin, y);
  y += 10;

  // Closing and signature
  doc.setFontSize(10);
  doc.text("Yours Sincerely,", margin, y);
  y += 6;
  doc.text("Mr Bashir Osman", margin, y);
  y += 5;
  doc.text("CEO PBG", margin, y);
  // Place larger stamp & signature just below the closing text
  y += 4;
  try {
    const signImg = await loadImageAsDataUrl("/images/Stamp & Signature.png");
    if (signImg) {
      const imgWidth = 110;
      const imgHeight = 64;
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
    "Close to Mogadishu airport, Wadajir-Mogadishu",
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
