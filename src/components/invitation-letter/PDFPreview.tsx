'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import PDFDownloader from './PDFDownloader';
import ProfessionalInvitationLetter from './ProfessionalInvitationLetter';

// Dynamic import to prevent SSR issues
const PDFViewer = React.lazy(() => import('./PDFViewer'));

import type { InvitationLetterData } from './types';

interface PDFPreviewProps {
  data: InvitationLetterData;
  isOpen: boolean;
  onClose: () => void;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Preview Invitation Letter</h3>
          <div className="flex items-center gap-2">
            <PDFDownloader 
              data={data} 
              fileName={`invitation-letter-${data.refNumber}.pdf`}
            >
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </PDFDownloader>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* PDF Content */}
        <div className="flex-1 overflow-auto p-4">
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">Loading PDF preview...</div>}>
            <PDFViewer data={data} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
