
import { useState } from "react";
import { type ClientDocument } from "./types";
import { uploadClientDocument } from "./use-client-uploads";

export function useClientDocuments(initialDocuments: ClientDocument[] = []) {
  const [documents, setDocuments] = useState<ClientDocument[]>(initialDocuments);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const handleDocumentUpload = async (files: FileList, clientId?: string) => {
    // For new clients, just store the files temporarily
    if (!clientId) {
      setDocumentFiles(prev => [...prev, ...Array.from(files)]);
      return;
    }

    try {
      const newDocs = await Promise.all(
        Array.from(files).map((file) => uploadClientDocument(file, clientId))
      );
      setDocuments((prev) => [...prev, ...newDocs]);
      return newDocs;
    } catch (error) {
      console.error("Document upload error:", error);
      throw error;
    }
  };

  const resetDocuments = (newDocs: ClientDocument[] = []) => {
    setDocuments(newDocs);
    setDocumentFiles([]);
  };

  return {
    documents,
    setDocuments,
    documentFiles,
    setDocumentFiles,
    handleDocumentUpload,
    resetDocuments
  };
}
