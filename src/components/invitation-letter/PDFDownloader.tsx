'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ProfessionalInvitationLetter from './ProfessionalInvitationLetter';

import type { InvitationLetterData } from './types';

interface PDFDownloaderProps {
  data: InvitationLetterData;
  fileName?: string;
  children?: React.ReactNode;
}

const PDFDownloader: React.FC<PDFDownloaderProps> = ({ 
  data, 
  fileName = 'invitation-letter.pdf',
  children 
}) => {
  return (
    <PDFDownloadLink
      document={<ProfessionalInvitationLetter data={data} />}
      fileName={fileName}
    >
      {({ loading, error }) => {
        if (error) {
          return (
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Error generating PDF
            </Button>
          );
        }
        
        if (loading) {
          return (
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Generating PDF...
            </Button>
          );
        }
        
        return children || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
};

export default PDFDownloader;
