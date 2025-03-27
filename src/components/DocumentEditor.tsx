"use client";

import React from "react";
import { useDocument } from "@/contexts/DocumentContext";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentViewer from "@/components/DocumentViewer";
import AnnotationToolbar from "@/components/AnnotationToolbar";

// Remove the worker initialization since it's already handled in DocumentViewer
const DocumentEditor: React.FC = () => {
  const { file } = useDocument();

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
