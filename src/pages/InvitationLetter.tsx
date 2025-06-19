import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// Use the uploaded Peace Business Group images - swapped positions
const STAMP_IMAGE = "/lovable-uploads/43e9df25-a96b-4a06-84fa-aede435f256d.png"; // Now used as stamp
const LOGO_IMAGE = "/lovable-uploads/cf1ef038-a300-45ad-a5f6-cafaa41ed89f.png"; // Now used as logo

const DEFAULT_COMPANY = {
  companyName: "PEACE BUSINESS GROUP",
  companyAddress: "Airport Road, Wadajir District, Mogadishu, Somalia",
  companyEmail: "movcon@peacebusinessgroup.com",
  companyPhone: "+252 61-94-94974",
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
      let y = 40;

      // Load and add Peace Business Group logo (now using the stamp image as logo)
      try {
        const logoBase64 = await loadImageAsBase64(LOGO_IMAGE);
        doc.addImage(logoBase64, "PNG", 40, y, 120, 80);
      } catch (logoError) {
        console.log("Logo loading error:", logoError);
        // Fallback text if image fails to load
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(65, 146, 218);
        doc.text("PEACE BUSINESS GROUP", 40, y + 40);
      }

      // Professional company header
      doc.setFont("times", "bold");
      doc.setFontSize(26);
      doc.setTextColor(65, 146, 218);
      doc.text("PEACE BUSINESS GROUP", 170, y + 35);

      // Professional subtitle with proper spacing
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(
        "Airport Road, Wadajir District, Mogadishu, Somalia",
        170,
        y + 52
      );

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Email: bashir@peacebusinessgroup.com", 170, y + 66);
      doc.text("Website: www.peacebusinessgroup.com", 170, y + 78);
      doc.text("Mobile: +252 61 - 8178782", 170, y + 90);

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

      // Add Peace Business Group stamp/seal (now using the logo image as stamp)
      try {
        const stampBase64 = await loadImageAsBase64(STAMP_IMAGE);
        doc.addImage(stampBase64, "PNG", 380, y - 80, 120, 120);
      } catch (stampError) {
        console.log("Stamp loading error:", stampError);
        // Fallback circular seal design
        const sealX = 440;
        const sealY = y - 20;
        const sealRadius = 40;

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
        doc.text("PEACE BUSINESS", sealX - 25, sealY - 10);
        doc.text("GROUP", sealX - 15, sealY);
        doc.text("SOMALIA", sealX - 18, sealY + 10);
      }

      doc.setTextColor(0, 0, 0);
      y += 40;

      // Contact information
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const contactText = `Peace Hotels, Mogadishu Somalia +252619494973 / +252619494974
reservations@peacebusinessgroup.com or movcon@peacebusinessgroup.com
Close to Mogadishu airport, Wadajir-Mogadishu`;

      const contactLines = contactText.split("\n");
      contactLines.forEach((line, index) => {
        doc.text(line, 40, y + index * 12);
      });

      y += contactLines.length * 12 + 20;

      // Bottom line
      doc.setDrawColor(108, 168, 221);
      doc.setLineWidth(2);
      doc.line(40, y, pageWidth - 40, y);

      y += 15;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(108, 168, 221);
      const footerText = `Peace Hotels Inc. Mogadishu Somalia. www.peacehotelsom.com
Off Aden Adde Airport Road, Wadajir, Mogadishu, SOMALIA
Tel: +252 61-94-94974 E-mail: movcon@peacebusinessgroup.com`;

      const footerLines = footerText.split("\n");
      footerLines.forEach((line, index) => {
        doc.text(line, 40, y + index * 10);
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
