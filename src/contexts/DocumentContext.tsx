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
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  underlineColor: string;
  setUnderlineColor: (color: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  const [highlightColor, setHighlightColor] = useState<string>('#FFEB3B'); // Default yellow for highlights
  const [underlineColor, setUnderlineColor] = useState<string>('#4285F4'); // Default blue for underlines

  // History states for undo/redo functionality
  const [past, setPast] = useState<Annotation[][]>([]);
  const [future, setFuture] = useState<Annotation[][]>([]);

  // Helper function to update annotations while tracking history
  const updateAnnotationsWithHistory = (newAnnotations: Annotation[]) => {
    setPast([...past, annotations]);
    setAnnotations(newAnnotations);
    setFuture([]);
  };

  const addAnnotation = (annotation: Omit<Annotation, "id">) => {
    // Determine which color to use based on annotation type
    let colorToUse = annotationColor;
    if (annotation.type === "highlight") {
      colorToUse = highlightColor;
    } else if (annotation.type === "underline") {
      colorToUse = underlineColor;
    }
    
    const newAnnotation = {
      ...annotation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      color: annotation.color || colorToUse, // Use the type-appropriate color
    };
    
    // Add to history and update annotations
    updateAnnotationsWithHistory([...annotations, newAnnotation]);
  };

  const updateAnnotation = (id: string, updatedAnnotation: Annotation) => {
    updateAnnotationsWithHistory(
      annotations.map((a) => (a.id === id ? updatedAnnotation : a))
    );
  };

  const removeAnnotation = (id: string) => {
    updateAnnotationsWithHistory(annotations.filter((a) => a.id !== id));
  };

  // Override setAnnotations to track history
  const setAnnotationsWithHistory = (newAnnotations: Annotation[]) => {
    setPast([...past, annotations]);
    setAnnotations(newAnnotations);
    setFuture([]);
  };

  // Undo function
  const undo = () => {
    if (past.length === 0) return;
    
    const lastState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture([annotations, ...future]);
    setPast(newPast);
    setAnnotations(lastState);
  };

  // Redo function
  const redo = () => {
    if (future.length === 0) return;
    
    const nextState = future[0];
    const newFuture = future.slice(1);
    
    setPast([...past, annotations]);
    setFuture(newFuture);
    setAnnotations(nextState);
  };

  // Check if undo/redo actions are available
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

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
        setActiveAnnotation,
        setAnnotations: setAnnotationsWithHistory,
        annotationColor,
        setAnnotationColor,
        highlightColor,
        setHighlightColor,
        underlineColor,
        setUnderlineColor,
        undo,
        redo,
        canUndo,
        canRedo,
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


