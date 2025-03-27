"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Annotation = {
  id: string;
  type: "highlight" | "underline" | "comment" | "signature";
  pageNumber: number;
  content?: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color?: string;
  imageData?: string;
};

interface DocumentContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  annotations: Annotation[];
  addAnnotation: (annotation: Omit<Annotation, "id">) => void;
  updateAnnotation: (id: string, annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  currentTool:
    | "select"
    | "highlight"
    | "underline"
    | "comment"
    | "signature"
    | null;
  setCurrentTool: (
    tool: "select" | "highlight" | "underline" | "comment" | "signature" | null
  ) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;
  isExporting: boolean;
  setIsExporting: (exporting: boolean) => void;
  activeAnnotation: Annotation | null;
  setActiveAnnotation: (annotation: Annotation | null) => void;
  setAnnotations: (annotations: Annotation[] ) => void;
  annotationColor: string;
  setAnnotationColor: (color: string) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<
    "select" | "highlight" | "underline" | "comment" | "signature" | null
  >(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(
    null
  );
  const [annotationColor, setAnnotationColor] = useState<string>('#FFEB3B'); // Default yellow color

  const addAnnotation = (annotation: Omit<Annotation, "id">) => {
    const newAnnotation = {
      ...annotation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      color: annotation.color || annotationColor, // Use the current annotation color if not specified
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const updateAnnotation = (id: string, updatedAnnotation: Annotation) => {
    setAnnotations(
      annotations.map((a) => (a.id === id ? updatedAnnotation : a))
    );
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  return (
    <DocumentContext.Provider
      value={{
        file,
        setFile,
        annotations,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        currentTool,
        setCurrentTool,
        currentPage,
        setCurrentPage,
        totalPages,
        setTotalPages,
        isExporting,
        setIsExporting,
        activeAnnotation,
        setActiveAnnotation, // Make sure this is included here!
        setAnnotations,
        annotationColor,
        setAnnotationColor,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
};

// Also export Annotation type for use in other files
export type { Annotation };
