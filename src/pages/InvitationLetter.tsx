import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDownloader } from "@/components/invitation-letter";
import type { InvitationLetterData } from "@/components/invitation-letter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      </div>
    </div>
  );
};

export default InvitationLetter;
