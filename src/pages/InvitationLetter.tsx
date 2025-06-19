import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// Peace Business Group Logo - Placeholder for now (will be updated with actual image)
const loadImageAsBase64 = async (imageFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

// Peace Business Group Logo - Professional dove in shield design
const LOGO_BASE64 =
  "data:image/png;base64,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";

// Peace Business Group Stamp
const STAMP_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAACXBIWXMAAAsTAAALEwEAmpwYAAABRmlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAeKADAAQAAAABAAAAeAAAAAD+S1x5AAAABWlDQ1BJQ0MgcHJvZmlsZQAAeJxjYGBSSCwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAABVJREFUeJztxUEBAAAMAJDAZ3F+/4IAjwAAAAAAAAAAAAAAAAAAAAAAAAAANgHKAZvAAGXOAAAAAElFTkSuQmCC";

const DEFAULT_LOGO = "/og-image.png"; // fallback logo (should be PNG)
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

  useEffect(() => {
    setFormData((prev) => ({ ...prev, refNumber: generateRefNumber() }));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      let y = 40;

      // Add Peace Business Group logo - Professional design
      try {
        doc.addImage(LOGO_BASE64, "PNG", 40, y, 80, 80);
      } catch (logoError) {
        console.log("Logo loading error, using professional fallback");
        // Professional shield with dove design
        const logoX = 40;
        const logoY = y;
        const logoSize = 80;

        // Draw gradient-like shield background
        doc.setFillColor(65, 146, 218); // Primary blue
        const shieldPath = [
          [logoX + 20, logoY + 10],
          [logoX + 60, logoY + 10],
          [logoX + 65, logoY + 15],
          [logoX + 65, logoY + 50],
          [logoX + 55, logoY + 70],
          [logoX + 40, logoY + 75],
          [logoX + 25, logoY + 70],
          [logoX + 15, logoY + 50],
          [logoX + 15, logoY + 15],
          [logoX + 20, logoY + 10],
        ];

        // Create shield shape
        doc.setLineWidth(0);
        const lines = shieldPath
          .slice(1)
          .map((point) => [
            point[0] - shieldPath[0][0],
            point[1] - shieldPath[0][1],
          ]);
        doc.lines(lines, shieldPath[0][0], shieldPath[0][1], null, "F");

        // Add dove silhouette
        doc.setFillColor(255, 255, 255);
        // Dove body
        doc.ellipse(logoX + 40, logoY + 45, 15, 10, "F");
        // Dove head
        doc.circle(logoX + 50, logoY + 35, 6, "F");
        // Wing detail
        doc.ellipse(logoX + 35, logoY + 40, 8, 12, "F");

        // Add subtle "PBG" text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("PBG", logoX + 32, logoY + 65);
      }

      // Professional company header
      doc.setFont("times", "bold");
      doc.setFontSize(26);
      doc.setTextColor(65, 146, 218);
      doc.text("PEACE BUSINESS GROUP", 135, y + 35);

      // Professional subtitle with proper spacing
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(
        "Airport Road, Wadajir District, Mogadishu, Somalia",
        135,
        y + 52
      );

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Email: reservations@peacebusinessgroup.com", 135, y + 66);
      doc.text("Alternative: movcon@peacebusinessgroup.com", 135, y + 78);
      doc.text("Phone: +252 61-94-94973 / +252 61-94-94974", 135, y + 90);

      // Elegant divider line
      y += 110;
      doc.setDrawColor(65, 146, 218);
      doc.setLineWidth(1.5);
      doc.line(40, y, pageWidth - 40, y);

      y += 35;

      // Professional reference and date layout
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      const refText = `Ref: ${formData.refNumber}`;
      const dateText = `Date: ${
        formData.date
          ? new Date(formData.date)
              .toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              .toUpperCase()
          : ""
      }`;

      doc.text(refText, 40, y);
      doc.text(dateText, pageWidth - 120, y);

      y += 45;

      // Formal recipient address
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text("The Director General", 40, y);
      y += 15;
      doc.text("Federal Government of Somalia", 40, y);
      y += 15;
      doc.text("Immigration & Nationality Agency", 40, y);

      y += 35;

      // Subject line with professional formatting
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(65, 146, 218);
      doc.text(
        `SUBJECT: INVITATION LETTER - ${formData.purposeOfVisit.toUpperCase()}`,
        40,
        y
      );

      y += 35;

      // Professional body text with proper formatting
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);

      const bodyText = `Dear Sir/Madam,

We write to formally inform you that the below-mentioned individual will be visiting the Federal Republic of Somalia for business purposes. The visitor will be accommodated at Peace Hotel Mogadishu, which is conveniently located adjacent to Aden Adde International Airport.

Peace Business Group hereby assumes full responsibility for the visitor's accommodation, safety, and all associated arrangements during their stay in Mogadishu. We kindly request your assistance in facilitating the visa process for this distinguished guest.

The details of the visitor are as follows:`;

      const splitText = doc.splitTextToSize(bodyText, pageWidth - 80);
      doc.text(splitText, 40, y);
      y += splitText.length * 14 + 25;
      autoTable(doc, {
        startY: y,
        head: [
          [
            "NO",
            "NAME",
            "NATIONALITY",
            "ORG",
            "PASSPORT NO.",
            "PASSPORT EXP DATE",
          ],
        ],
        body: [
          [
            "1",
            formData.visitorName.toUpperCase(),
            formData.visitorNationality.toUpperCase(),
            formData.visitorOrg.toUpperCase(),
            formData.visitorPassport,
            formData.passportExpiry
              ? new Date(formData.passportExpiry)
                  .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  .toUpperCase()
              : "",
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [65, 146, 218],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: 10,
          font: "times",
        },
        bodyStyles: {
          halign: "center",
          fontSize: 10,
          font: "times",
          textColor: [40, 40, 40],
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [65, 146, 218],
          lineWidth: 0.8,
        },
        margin: { left: 40, right: 40 },
        tableWidth: pageWidth - 80,
      });
      y = (doc as any).lastAutoTable.finalY + 40;

      // Professional closing paragraph
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      const closingText = `We appreciate your cooperation in facilitating this visa application and look forward to hosting our distinguished visitor. Should you require any additional information or clarification, please do not hesitate to contact us at the above-mentioned contact details.`;

      const closingSplit = doc.splitTextToSize(closingText, pageWidth - 80);
      doc.text(closingSplit, 40, y);
      y += closingSplit.length * 14 + 30;

      // Professional signature section
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text("Yours faithfully,", 40, y);
      y += 25;

      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text("Mr. Bashir Osman", 40, y);
      y += 15;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text("Chief Executive Officer", 40, y);
      y += 12;
      doc.text("Peace Business Group", 40, y);

      // Add professional company stamp/seal
      try {
        doc.addImage(STAMP_BASE64, "PNG", 380, y - 60, 100, 70);
      } catch (stampError) {
        console.log("Stamp loading error, using professional seal");
        // Professional circular seal design
        const sealX = 430;
        const sealY = y - 25;
        const sealRadius = 35;

        // Outer circle
        doc.setFillColor(65, 146, 218);
        doc.circle(sealX, sealY, sealRadius, "F");

        // Inner border circle
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(2);
        doc.circle(sealX, sealY, sealRadius - 3);

        // Company text in seal
        doc.setTextColor(255, 255, 255);
        doc.setFont("times", "bold");
        doc.setFontSize(8);

        // Curved text effect (simplified)
        doc.text("PEACE BUSINESS", sealX - 20, sealY - 10);
        doc.text("GROUP", sealX - 10, sealY);
        doc.text("SOMALIA", sealX - 12, sealY + 10);

        // Date
        const currentDate = new Date().getFullYear();
        doc.setFontSize(6);
        doc.text(`EST. ${currentDate}`, sealX - 12, sealY + 20);
      }

      doc.setTextColor(0, 0, 0);
      y += 40;

      // Contact information section with improved design
      doc.setDrawColor(65, 146, 218);
      doc.setLineWidth(1);
      doc.line(40, y, pageWidth - 40, y);

      y += 20;

      // Simplified footer with essential information only
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);

      // Center the contact information
      const contactInfo = [
        "Peace Business Group - Airport Road, Wadajir District, Mogadishu, Somalia",
        "Phone: +252 61-94-94973 / +252 61-94-94974",
        "Email: reservations@peacebusinessgroup.com | movcon@peacebusinessgroup.com",
      ];

      contactInfo.forEach((line, index) => {
        const textWidth = doc.getTextWidth(line);
        const textX = (pageWidth - textWidth) / 2; // Center the text
        doc.text(line, textX, y + index * 12);
      });
      const fileName = `invitation-letter-${formData.visitorName.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}.pdf`;
      doc.save(fileName);
      setLoading(false);
      toast.success("Invitation letter generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setLoading(false);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="shadow-lg border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center mb-2">
            Visa Invitation Letter Generator
          </CardTitle>
          <p className="text-muted-foreground text-center text-sm">
            Fill in the details below to generate a professional invitation
            letter for visa facilitation.
          </p>
        </CardHeader>
        <CardContent>
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
                  <Label htmlFor="passportExpiry">Passport Expiry Date</Label>
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
              {loading ? <span className="animate-spin mr-2">⏳</span> : null}{" "}
              Generate Invitation Letter PDF
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationLetter;
