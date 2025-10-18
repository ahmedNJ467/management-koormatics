export interface InvitationLetterData {
  id?: number; // Database ID for unique identification
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
  subject: string;
}
