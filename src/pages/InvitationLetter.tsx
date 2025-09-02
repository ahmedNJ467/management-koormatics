import React, { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
// jsPDF will be imported dynamically to avoid SSR issues
import {
  FileText,
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  Loader2,
  Eye,
  Eye as Preview,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// PDF components will be imported dynamically to avoid SSR issues
import type { InvitationLetterData } from "@/components/invitation-letter";

// Dynamic imports for PDF components
const PDFDownloader = React.lazy(() =>
  import("@/components/invitation-letter").then((module) => ({
    default: module.PDFDownloader,
  }))
);
const PDFPreview = React.lazy(() =>
  import("@/components/invitation-letter").then((module) => ({
    default: module.PDFPreview,
  }))
);

interface FormData {
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
    visitDate: "",
    durationOfStay: "",
    purposeOfVisit: "Peace Hotel Reservation",
  });

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<InvitationLetterData | null>(
    null
  );

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
        .eq("generated_by", user.id as any)
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
    // This function is no longer needed - using React-PDF instead
    setLoading(false);
    return;
  };

  const regeneratePDF = async (historyItem: any) => {
    // This function is no longer needed - using React-PDF instead
    setLoading(false);
    return;
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

  const deleteHistoryItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this invitation letter?"))
      return;

    try {
      const { error } = await supabase
        .from("invitation_letters")
        .delete()
        .eq("id", id as any);

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
    try {
      setLoading(true);

      // Dynamically import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import("jspdf");

      // Create a new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Set margins and starting position - ultra compact for single page
      const margin = 12;
      let y = 20;

      // Professional letterhead design - more compact
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 20, "F");
      y += 3;

      // Company name in white on blue background
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(historyItem.company_name, pageWidth / 2, y, { align: "center" });
      y += 15;

      // Company details below the header bar - more compact
      doc.setFontSize(6);
      doc.setTextColor(52, 73, 94);
      doc.text(historyItem.company_address, pageWidth / 2, y, {
        align: "center",
      });
      y += 4;
      doc.text(historyItem.company_email, pageWidth / 2, y, {
        align: "center",
      });
      y += 4;
      doc.text(historyItem.company_phone, pageWidth / 2, y, {
        align: "center",
      });
      y += 8;

      // Document title - smaller
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text("OFFICIAL INVITATION LETTER", pageWidth / 2, y, {
        align: "center",
      });
      y += 12;

      // Reference and Date - side by side, more compact
      doc.setFontSize(8);
      doc.setTextColor(52, 73, 94);
      doc.text(`Reference Number: ${historyItem.ref_number}`, margin, y);
      doc.text(
        `Date: ${new Date(historyItem.letter_date).toLocaleDateString(
          "en-GB"
        )}`,
        pageWidth - margin - 50,
        y
      );
      y += 10;

      // TO section - more compact
      doc.text("TO:", margin, y);
      y += 5;
      doc.text("The Director General", margin + 6, y);
      y += 4;
      doc.text("Federal Government of Somalia", margin + 6, y);
      y += 4;
      doc.text("Immigration & Nationality Agency", margin + 6, y);
      y += 8;

      // Subject - more compact
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(
        "SUBJECT: INVITATION LETTER - PEACE HOTEL RESERVATION",
        pageWidth / 2,
        y + 5,
        { align: "center" }
      );
      y += 12;

      // Salutation
      doc.setTextColor(52, 73, 94);
      doc.text("Dear Sir/Madam,", margin, y);
      y += 8;

      // Body - more compact
      doc.setFontSize(8);
      const bodyText = `We would like to inform you that the below guest will be visiting Mogadishu and will be accommodated in Peace Hotel Mogadishu located next to Adan Cade International Airport. Peace Business Group will be responsible for his accommodation and safety while visiting Mogadishu.`;
      const splitBody = doc.splitTextToSize(bodyText, pageWidth - 2 * margin);
      doc.text(splitBody, margin, y);
      y += splitBody.length * 3 + 6;

      const clarificationText = `For further clarification you may contact Peace Hotel.`;
      doc.text(clarificationText, margin, y);
      y += 8;

      // Guest details box - more compact
      doc.setFillColor(240, 244, 247);
      doc.rect(margin, y, pageWidth - 2 * margin, 35, "F");
      doc.setDrawColor(41, 128, 185);
      doc.rect(margin, y, pageWidth - 2 * margin, 35, "S");

      doc.setFontSize(9);
      doc.setTextColor(41, 128, 185);
      doc.text("Guest Details:", margin + 6, y + 8);

      doc.setFontSize(7);
      doc.setTextColor(52, 73, 94);
      doc.text(
        `Full Name: ${historyItem.visitor_name.toUpperCase()}`,
        margin + 6,
        y + 16
      );
      doc.text(
        `Nationality: ${historyItem.visitor_nationality.toUpperCase()}`,
        margin + 6,
        y + 22
      );
      doc.text(
        `Organization: ${historyItem.visitor_organization}`,
        margin + 6,
        y + 28
      );

      doc.text(
        `Passport Number: ${historyItem.visitor_passport}`,
        pageWidth / 2 + 3,
        y + 16
      );
      doc.text(
        `Passport Expiry: ${historyItem.passport_expiry}`,
        pageWidth / 2 + 3,
        y + 22
      );
      doc.text(
        `Date of Visit: ${historyItem.date_of_visit}`,
        pageWidth / 2 + 3,
        y + 28
      );

      y += 40;

      // Commitment - more compact
      const commitmentText = `We guarantee full compliance with immigration regulations and commitment to ensuring the visitor's departure within the specified timeframe.`;
      const splitCommitment = doc.splitTextToSize(
        commitmentText,
        pageWidth - 2 * margin
      );
      doc.text(splitCommitment, margin, y);
      y += splitCommitment.length * 3 + 8;

      // Closing - more compact
      doc.text("Thank you for your consideration.", margin, y);
      y += 8;
      doc.text("Yours sincerely,", margin, y);
      y += 8;
      doc.text("Authorized Signature:", margin, y);
      y += 6;
      doc.line(margin, y, margin + 80, y);
      y += 8;

      // Footer - positioned to ensure single page
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Official document digitally generated by Peace Business Group.",
        pageWidth / 2,
        pageHeight - 10,
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

  const downloadHistoryFile = async (historyItem: any) => {
    // This function is no longer needed - using React-PDF instead
    setLoading(false);
    return;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold">
              Visa Invitation Letter Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Generate professional invitation letters and manage your history.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "generate"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Generate Letter
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {activeTab === "generate" ? (
          /* Generate Letter Form */
          <div className="bg-card rounded-lg p-6 border border-border">
            <form className="space-y-6">
              {/* Company Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Address
                    </label>
                    <input
                      type="text"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Email
                    </label>
                    <input
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Phone
                    </label>
                    <input
                      type="tel"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="refNumber"
                      value={formData.refNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                  Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Passport Expiry Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="passportExpiryDate"
                        value={formData.passportExpiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date of Visit
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="visitDate"
                        value={formData.visitDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Duration of Stay
                    </label>
                    <input
                      type="text"
                      name="durationOfStay"
                      value={formData.durationOfStay}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Purpose of Visit
                    </label>
                    <textarea
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPreviewData(formData);
                    setPreviewOpen(true);
                  }}
                  className="px-8 py-3 font-medium text-lg"
                >
                  <Preview className="h-5 w-5 mr-2" />
                  Preview Letter
                </Button>

                <React.Suspense fallback={<div>Loading PDF Downloader...</div>}>
                  <PDFDownloader
                    data={formData}
                    fileName={`invitation-letter-${formData.refNumber}.pdf`}
                  >
                    <Button
                      type="button"
                      className="px-8 py-3 font-medium text-lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download PDF
                    </Button>
                  </PDFDownloader>
                </React.Suspense>
              </div>
            </form>
          </div>
        ) : (
          /* History Section */
          <div className="bg-card rounded-lg p-6 border border-border">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, nationality, reference, purpose, or organization"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "newest" | "oldest")
                  }
                  className="px-4 py-2 bg-background text-foreground rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-muted-foreground mb-4">
              {sortedHistory.length} of {history.length} letters
            </div>

            {/* History Items */}
            {sortedHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
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
                    className="bg-muted p-4 rounded-lg border border-border hover:border-ring transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-foreground text-lg">
                            {item.visitor_name}
                          </h3>
                          {item.visitor_nationality && (
                            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                              {item.visitor_nationality}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground space-y-1">
                          <p>
                            <span className="text-muted-foreground/70">
                              Ref:
                            </span>{" "}
                            {item.ref_number}
                          </p>
                          <p>
                            <span className="text-muted-foreground/70">
                              Organization:
                            </span>{" "}
                            {item.visitor_organization || "N/A"}
                          </p>
                          <p>
                            <span className="text-muted-foreground/70">
                              Generated:
                            </span>{" "}
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
                            <span className="text-muted-foreground/70">
                              Purpose:
                            </span>{" "}
                            {item.purpose_of_visit || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadHistoryItem(item)}
                          className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Load
                        </button>

                        {item.pdf_url ? (
                          <button
                            onClick={() => downloadHistoryFile(item)}
                            className="px-3 py-2 bg-green-600 text-green-foreground rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed flex items-center gap-2"
                            title="No PDF file available"
                          >
                            <Download className="w-4 h-4" />
                            No File
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete(item.id)}
                          className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
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
            <div className="bg-card rounded-lg p-6 border border-border max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Delete Invitation Letter
                </h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this invitation letter? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={loading}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview */}
        {previewData && (
          <React.Suspense fallback={<div>Loading PDF Preview...</div>}>
            <PDFPreview
              data={previewData}
              isOpen={previewOpen}
              onClose={() => {
                setPreviewOpen(false);
                setPreviewData(null);
              }}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
};

export default InvitationLetter;
