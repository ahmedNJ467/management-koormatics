import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type InvitationLetter = Tables<"invitation_letters">;
export type InvitationLetterInsert = TablesInsert<"invitation_letters">;

// Interface for the form data (keeping compatibility with existing code)
export interface InvitationFormData {
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

// Convert form data to database record
export const convertFormDataToDbRecord = (
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
export const convertDbRecordToFormData = (
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

// Get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
};

// Save invitation letter to database
export const saveInvitationLetter = async (
  formData: InvitationFormData,
  fileName: string
): Promise<InvitationLetter | null> => {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      toast.error("You must be logged in to save invitation letters");
      return null;
    }

    const dbRecord = convertFormDataToDbRecord(formData, fileName, userId);

    const { data, error } = await supabase
      .from("invitation_letters")
      .insert(dbRecord)
      .select()
      .single();

    if (error) {
      console.error("Error saving invitation letter:", error);
      toast.error("Failed to save invitation letter to database");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error saving invitation letter:", error);
    toast.error("Failed to save invitation letter");
    return null;
  }
};

// Get all invitation letters for current user
export const getInvitationLetters = async (): Promise<InvitationLetter[]> => {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from("invitation_letters")
      .select("*")
      .eq("generated_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitation letters:", error);
      toast.error("Failed to load invitation letters");
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching invitation letters:", error);
    return [];
  }
};

// Delete invitation letter
export const deleteInvitationLetter = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("invitation_letters")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting invitation letter:", error);
      toast.error("Failed to delete invitation letter");
      return false;
    }

    toast.success("Invitation letter deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting invitation letter:", error);
    toast.error("Failed to delete invitation letter");
    return false;
  }
};

// Search invitation letters
export const searchInvitationLetters = async (
  searchTerm: string
): Promise<InvitationLetter[]> => {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return [];
    }

    if (!searchTerm.trim()) {
      return getInvitationLetters();
    }

    const { data, error } = await supabase
      .from("invitation_letters")
      .select("*")
      .eq("generated_by", userId)
      .or(
        `visitor_name.ilike.%${searchTerm}%,visitor_nationality.ilike.%${searchTerm}%,ref_number.ilike.%${searchTerm}%,purpose_of_visit.ilike.%${searchTerm}%`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching invitation letters:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error searching invitation letters:", error);
    return [];
  }
};

// Migrate localStorage data to database
export const migrateLocalStorageToDatabase = async (): Promise<void> => {
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
    const existingData = await getInvitationLetters();
    if (existingData.length > 0) {
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
    }
  } catch (error) {
    console.error("Error migrating localStorage data:", error);
  }
};
