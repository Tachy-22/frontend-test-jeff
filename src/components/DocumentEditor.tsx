"use client";

import React, { useEffect } from "react";
import { useDocument } from "@/contexts/DocumentContext";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentViewer from "@/components/DocumentViewer";
import AnnotationToolbar from "@/components/AnnotationToolbar";
import { toast } from "@/hooks/use-toast";

const DocumentEditor: React.FC = () => {
  const { file } = useDocument();

  useEffect(() => {
    // Initialize PDF.js worker
    const initWorker = async () => {
      const { GlobalWorkerOptions } = await import("pdfjs-dist/build/pdf");
      const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.entry");
      GlobalWorkerOptions.workerSrc = pdfjsWorker;
    };

    initWorker().catch((error) => {
      toast({
        title: "Error",
        description: "Failed to initialize PDF viewer",
        variant: "destructive",
      });
      console.error("Failed to initialize PDF worker:", error);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Document Signer & Annotation Tool
        </h1>

        {!file ? (
          <DocumentUpload />
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-9/12">
              <DocumentViewer />
            </div>
            <div className="lg:w-3/12">
              <AnnotationToolbar />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;
