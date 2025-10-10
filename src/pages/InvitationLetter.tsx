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
  purposeOfVisit: string;
  subject: string;
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
    purposeOfVisit:
      "We would like to inform you that the below guest will be visiting Mogadishu and he will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.\n\nWe kindly request your assistance in facilitating the necessary visa and entry procedures for the above-mentioned guest. Should you require any additional information or documentation, please do not hesitate to contact us.\n\nWe look forward to your favorable consideration.",
    subject: "Official Invitation for Business Visit",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [history, setHistory] = useState<InvitationLetterData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    item: InvitationLetterData | null;
  }>({
    isOpen: false,
    item: null,
  });

  // Filter history based on search term
  const filteredHistory = history.filter(
    (item) =>
      item.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open delete confirmation dialog
  const openDeleteConfirm = (item: InvitationLetterData) => {
    setDeleteConfirm({
      isOpen: true,
      item: item,
    });
  };

  // Close delete confirmation dialog
  const closeDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: false,
      item: null,
    });
  };

  // Delete invitation letter from database
  const deleteInvitationLetter = async () => {
    if (!deleteConfirm.item || !deleteConfirm.item.id) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error(
          "No authenticated user found for deleting invitation letter"
        );
        return;
      }

      const { error } = await supabase
        .from("invitation_letters")
        .delete()
        .eq("id", deleteConfirm.item.id.toString())
        .eq("generated_by", user.id);

      if (error) {
        console.error("Failed to delete invitation letter:", error);
        throw error;
      }

      // Update local history state
      setHistory((prev) =>
        prev.filter((item) => item.id !== deleteConfirm.item!.id)
      );

      // Close confirmation dialog
      closeDeleteConfirm();
    } catch (error) {
      console.error("Error deleting invitation letter:", error);
    }
  };

  // Load history from database
  const loadHistoryFromDb = async () => {
    try {
      // Check if user is authenticated
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError) {
        console.error("Authentication error:", authError);
        throw authError;
      }

      if (!session?.user) {
        console.error("No authenticated user found");
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("invitation_letters")
        .select("*")
        .eq("generated_by", session.user.id) // Only get records for current user
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Database query error:", error);
        throw error;
      }

      // Convert database format to InvitationLetterData format
      const formattedData =
        data?.map((item: any) => ({
          id: item.id, // Include database ID for unique identification
          refNumber: item.ref_number,
          date: item.date,
          companyName: item.company_name,
          companyAddress: item.company_address,
          companyPhone: item.company_phone,
          companyEmail: item.company_email,
          guestName: item.guest_name,
          nationality: item.nationality,
          organization: item.organization,
          passportNumber: item.passport_number,
          passportExpiryDate: item.passport_expiry_date,
          visitDate: item.date, // Use date as visitDate
          durationOfStay: "Not specified", // Default value
          purposeOfVisit: item.purpose_of_visit,
          subject: item.subject || "Official Invitation for Business Visit",
        })) || [];

      setHistory(formattedData);
    } catch (error) {
      console.error("Failed to load history from database:", error);
      // Fallback to localStorage
      try {
        const raw =
          typeof window !== "undefined"
            ? localStorage.getItem("invitationLetterHistory")
            : null;
        if (raw) {
          setHistory(JSON.parse(raw) as InvitationLetterData[]);
        }
      } catch {}
    }
  };

  // Load history on component mount
  useEffect(() => {
    loadHistoryFromDb();
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
      console.log("saveHistoryToDb called with entry:", entry);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error(
          "No authenticated user found for saving invitation letter"
        );
        return;
      }

      // Validate required fields
      console.log("Validating entry:", entry);
      if (
        !entry.guestName ||
        !entry.nationality ||
        !entry.organization ||
        !entry.passportNumber
      ) {
        console.error("Missing required fields:", {
          guestName: entry.guestName,
          nationality: entry.nationality,
          organization: entry.organization,
          passportNumber: entry.passportNumber,
          fullEntry: entry,
        });
        throw new Error("Missing required fields for invitation letter");
      }

      // Convert date strings to proper format
      const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        // Convert from YYYY-MM-DD to YYYY-MM-DD (should already be correct)
        return dateStr;
      };

      const insertData = {
        ref_number: entry.refNumber,
        date: formatDate(entry.date),
        company_name: entry.companyName,
        company_address: entry.companyAddress,
        company_phone: entry.companyPhone,
        company_email: entry.companyEmail,
        guest_name: entry.guestName,
        nationality: entry.nationality,
        organization: entry.organization,
        passport_number: entry.passportNumber,
        passport_expiry_date: formatDate(entry.passportExpiryDate),
        purpose_of_visit: entry.purposeOfVisit,
        subject: entry.subject,
        file_name: `invitation-letter-${entry.refNumber}.pdf`,
        generated_by: user.id,
        form_data: entry as any,
      };

      console.log("Attempting to insert data:", insertData);

      const { data: insertedData, error } = await supabase
        .from("invitation_letters")
        .insert([insertData] as any)
        .select()
        .single();

      if (error) {
        console.error("Database insert error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          insertData: insertData,
        });
        console.error("Full error object:", error);
        throw error;
      }

      // Update the entry with the database ID
      if (insertedData) {
        entry.id = parseInt(insertedData.id);
      }
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
                    <Label htmlFor="subject">Letter Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g., Official Invitation for Business Visit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purposeOfVisit">Body of the Letter</Label>
                    <textarea
                      id="purposeOfVisit"
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleInputChange}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter the main body content of the invitation letter..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    console.log("Current form data:", formData);
                    console.log("Form data keys:", Object.keys(formData));
                  }}
                >
                  Debug Form Data
                </Button>
                <PDFDownloader
                  data={formData as InvitationLetterData}
                  fileName={`invitation-letter-${formData.refNumber}.pdf`}
                  onDownloaded={async (d) => {
                    console.log("PDF downloaded, form data:", formData);
                    console.log("PDF downloaded, received data:", d);
                    console.log(
                      "PDF downloaded, received data keys:",
                      Object.keys(d)
                    );
                    await saveHistoryToDb(d);
                    // Refresh history from database to get the latest data with IDs
                    await loadHistoryFromDb();
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
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Search by guest name, organization, reference number, or nationality..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {searchTerm
                      ? "No matching results found."
                      : "No history yet."}
                  </div>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <div
                      key={`${item.refNumber}-${idx}`}
                      className="flex items-center justify-between gap-2 border rounded-md p-3"
                    >
                      <div className="text-sm flex-1">
                        <div className="font-medium">
                          {item.guestName || "Guest"} — {item.organization}
                        </div>
                        <div className="text-muted-foreground">
                          Ref: {item.refNumber} • Date:{" "}
                          {new Date(item.date).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <PDFDownloader
                          data={item}
                          fileName={`invitation-letter-${item.refNumber}.pdf`}
                        >
                          <Button type="button" variant="outline" size="sm">
                            Re-download
                          </Button>
                        </PDFDownloader>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteConfirm(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.isOpen && deleteConfirm.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">
                Delete Invitation Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Are you sure you want to delete the invitation letter for:
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="font-medium">
                  {deleteConfirm.item.guestName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {deleteConfirm.item.organization} • Ref:{" "}
                  {deleteConfirm.item.refNumber}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                This action cannot be undone.
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeDeleteConfirm}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteInvitationLetter}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvitationLetter;
