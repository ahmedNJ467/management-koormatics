'use client';

import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { InvitationLetterData } from './types';
import ProfessionalInvitationLetter from './ProfessionalInvitationLetter';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  data: InvitationLetterData;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ data }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="border rounded-lg p-4">
      <ProfessionalInvitationLetter data={data} />
    </div>
  );
};

export default PDFViewer;
