import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Register fonts
Font.register({
  family: "Times-Roman",
  src: "https://fonts.gstatic.com/s/timesroman/v1/TimesNewRoman.ttf",
});

Font.register({
  family: "Helvetica",
  src: "https://fonts.gstatic.com/s/helveticaneue/v1/HelveticaNeue.ttf",
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Times-Roman",
    position: "relative",
  },

  // Watermark
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-45deg)",
    fontSize: 48,
    color: "#f0f0f0",
    opacity: 0.1,
    fontFamily: "Helvetica",
    fontWeight: "bold",
  },

  // Header section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottom: "2px solid #1e40af",
    paddingBottom: 20,
  },

  logoSection: {
    flex: 1,
    alignItems: "flex-start",
  },

  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
  },

  companyInfo: {
    flex: 1,
    alignItems: "flex-end",
    textAlign: "right",
  },

  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    fontFamily: "Helvetica",
  },

  companyDetails: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
    fontFamily: "Helvetica",
  },

  // Title section
  titleSection: {
    alignItems: "center",
    marginBottom: 25,
  },

  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Helvetica",
  },

  referenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  referenceColumn: {
    flex: 1,
    marginHorizontal: 10,
  },

  referenceLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
    fontFamily: "Helvetica",
  },

  referenceValue: {
    fontSize: 12,
    color: "#111827",
    fontFamily: "Times-Roman",
  },

  // Subject section
  subjectSection: {
    backgroundColor: "#1e40af",
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },

  subjectText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Helvetica",
  },

  // Body content
  bodyContent: {
    marginBottom: 25,
  },

  bodyText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 1.6,
    marginBottom: 15,
    textAlign: "justify",
    fontFamily: "Times-Roman",
  },

  // Guest details section
  guestDetailsSection: {
    marginBottom: 25,
  },

  guestDetailsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#1e40af",
    color: "#ffffff",
    marginBottom: 15,
    textAlign: "center",
    padding: 8,
    fontFamily: "Helvetica",
  },

  detailsTable: {
    border: "1px solid #d1d5db",
    borderRadius: 4,
    overflow: "hidden",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 35,
  },

  tableRowAlternate: {
    flexDirection: "row",
    minHeight: 35,
    backgroundColor: "#f9fafb",
  },

  tableCell: {
    flex: 1,
    padding: 8,
    borderRight: "1px solid #d1d5db",
    justifyContent: "center",
  },

  tableCellLast: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
  },

  tableLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    fontFamily: "Helvetica",
  },

  tableValue: {
    fontSize: 10,
    color: "#111827",
    fontFamily: "Times-Roman",
  },

  // Commitment section
  commitmentSection: {
    marginBottom: 25,
  },

  commitmentText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 1.6,
    marginBottom: 15,
    textAlign: "justify",
    fontFamily: "Times-Roman",
  },

  // Closing section
  closingSection: {
    marginBottom: 30,
  },

  closingText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 1.6,
    marginBottom: 8,
    fontFamily: "Times-Roman",
  },

  signatureLine: {
    borderBottom: "1px solid #374151",
    width: 200,
    marginTop: 20,
    marginBottom: 8,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    alignItems: "center",
    borderTop: "1px solid #d1d5db",
    paddingTop: 15,
  },

  footerText: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
    fontFamily: "Helvetica",
  },
});

import type { InvitationLetterData } from './types';

interface ProfessionalInvitationLetterProps {
  data: InvitationLetterData;
}

const ProfessionalInvitationLetter: React.FC<
  ProfessionalInvitationLetterProps
> = ({ data }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>Peace Business Group</Text>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src="/images/pbg.jpg" style={styles.logo} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.companyDetails}>{data.companyAddress}</Text>
            <Text style={styles.companyDetails}>
              Phone: {data.companyPhone}
            </Text>
            <Text style={styles.companyDetails}>
              Email: {data.companyEmail}
            </Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>OFFICIAL INVITATION LETTER</Text>
          <View style={styles.referenceRow}>
            <View style={styles.referenceColumn}>
              <Text style={styles.referenceLabel}>REFERENCE NUMBER</Text>
              <Text style={styles.referenceValue}>{data.refNumber}</Text>
            </View>
            <View style={styles.referenceColumn}>
              <Text style={styles.referenceLabel}>DATE</Text>
              <Text style={styles.referenceValue}>{formatDate(data.date)}</Text>
            </View>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.subjectSection}>
          <Text style={styles.subjectText}>
            SUBJECT: INVITATION LETTER - PEACE HOTEL RESERVATION
          </Text>
        </View>

        {/* Body Content */}
        <View style={styles.bodyContent}>
          <Text style={styles.bodyText}>
            TO: The Director General{"\n"}
            Federal Government of Somalia{"\n"}
            Immigration & Nationality Agency
          </Text>

          <Text style={styles.bodyText}>Dear Sir/Madam,</Text>

          <Text style={styles.bodyText}>
            We would like to inform you that the below guest will be visiting
            Mogadishu and will be accommodated in Peace Hotel Mogadishu located
            next to Adan Cade International Airport. Peace Business Group will
            be responsible for his accommodation and safety while visiting
            Mogadishu.
          </Text>

          <Text style={styles.bodyText}>
            For further clarification you may contact Peace Hotel.
          </Text>
        </View>

        {/* Guest Details */}
        <View style={styles.guestDetailsSection}>
          <Text style={styles.guestDetailsTitle}>GUEST DETAILS</Text>
          <View style={styles.detailsTable}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Full Name</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>
                  {data.guestName.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.tableRowAlternate}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Nationality</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>
                  {data.nationality.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Organization</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>{data.organization}</Text>
              </View>
            </View>
            <View style={styles.tableRowAlternate}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Passport Number</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>{data.passportNumber}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Passport Expiry</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>
                  {formatDate(data.passportExpiryDate)}
                </Text>
              </View>
            </View>
            <View style={styles.tableRowAlternate}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Date of Visit</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>
                  {formatDate(data.visitDate)}
                </Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Duration of Stay</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>{data.durationOfStay}</Text>
              </View>
            </View>
            <View style={styles.tableRowAlternate}>
              <View style={styles.tableCell}>
                <Text style={styles.tableLabel}>Purpose of Visit</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text style={styles.tableValue}>{data.purposeOfVisit}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Commitment Section */}
        <View style={styles.commitmentSection}>
          <Text style={styles.commitmentText}>
            We guarantee full compliance with immigration regulations and
            commitment to ensuring the visitor's departure within the specified
            timeframe.
          </Text>
        </View>

        {/* Closing Section */}
        <View style={styles.closingSection}>
          <Text style={styles.closingText}>
            Thank you for your consideration.
          </Text>
          <Text style={styles.closingText}>Yours sincerely,</Text>
          <Text style={styles.closingText}>Authorized Signature:</Text>
          <View style={styles.signatureLine} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Official document digitally generated by Peace Business Group
          </Text>
          <Text style={styles.footerText}>
            {data.companyAddress} | Phone: {data.companyPhone} | Email:{" "}
            {data.companyEmail}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalInvitationLetter;
