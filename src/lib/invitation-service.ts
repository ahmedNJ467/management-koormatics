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
    date: formData.date, // Use 'date' not 'letter_date'
    company_name: formData.companyName,
    company_address: formData.companyAddress,
    company_email: formData.companyEmail,
    company_phone: formData.companyPhone,
    guest_name: formData.visitorName, // Use 'guest_name' not 'visitor_name'
    nationality: formData.visitorNationality, // Use 'nationality' not 'visitor_nationality'
    organization: formData.visitorOrg, // Use 'organization' not 'visitor_organization'
    passport_number: formData.visitorPassport, // Use 'passport_number' not 'visitor_passport'
    passport_expiry_date: formData.passportExpiry, // Use 'passport_expiry_date' not 'passport_expiry'
    purpose_of_visit: formData.purposeOfVisit,
    duration_of_stay: formData.durationOfStay,
    visit_date: formData.dateOfVisit, // Use 'visit_date' not 'date_of_visit'
    generated_by: userId,
    // Note: file_name and form_data columns will be added via migration
    // file_name: fileName,
    // form_data: formData as any,
  };
};

// Convert database record back to form data
export const convertDbRecordToFormData = (
  record: InvitationLetter
): InvitationFormData => {
  return {
    refNumber: record.ref_number,
    date: record.date, // Use 'date' not 'letter_date'
    companyName: record.company_name,
    companyAddress: record.company_address,
    companyEmail: record.company_email,
    companyPhone: record.company_phone,
    logo: null,
    visitorName: record.guest_name, // Use 'guest_name' not 'visitor_name'
    visitorPassport: record.passport_number, // Use 'passport_number' not 'visitor_passport'
    visitorNationality: record.nationality, // Use 'nationality' not 'visitor_nationality'
    visitorOrg: record.organization, // Use 'organization' not 'visitor_organization'
    passportExpiry: record.passport_expiry_date, // Use 'passport_expiry_date' not 'passport_expiry'
    purposeOfVisit: record.purpose_of_visit,
    durationOfStay: record.duration_of_stay,
    dateOfVisit: record.visit_date, // Use 'visit_date' not 'date_of_visit'
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
      console.error("You must be logged in to save invitation letters");
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
      console.error("Failed to save invitation letter to database");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error saving invitation letter:", error);
    console.error("Failed to save invitation letter");
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
      console.error("Failed to load invitation letters");
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
      console.error("Failed to delete invitation letter");
      return false;
    }

    console.log("Invitation letter deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting invitation letter:", error);
    console.error("Failed to delete invitation letter");
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
      console.log(
        `Successfully migrated ${successCount} invitation letters to database`
      );
      localStorage.removeItem("invitationLetterHistory");
    }
  } catch (error) {
    console.error("Error migrating localStorage data:", error);
  }
};
