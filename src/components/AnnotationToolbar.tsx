import React from "react";
import { useDocument } from "@/contexts/DocumentContext";
import { Button } from "@/components/ui/button";
import {
  Pointer,
  Highlighter,
  Underline,
  MessageSquare,
  Signature,
  Trash2,
  PaintBucket,
  Plus,
} from "lucide-react";
import SignatureCanvas from "@/components/SignatureCanvas";

const AnnotationToolbar: React.FC = () => {
  const {
    currentTool,
    setCurrentTool,
    annotations,
    removeAnnotation,
    currentPage,
    annotationColor,
    setAnnotationColor,
    setUnderlineColor,
    setHighlightColor,
  } = useDocument();

  const tools = [
    { name: "select", icon: Pointer, label: "Select" },
    { name: "highlight", icon: Highlighter, label: "Highlight" },
    { name: "underline", icon: Underline, label: "Underline" },
    { name: "comment", icon: MessageSquare, label: "Comment" },
    { name: "signature", icon: Signature, label: "Signature" },
  ] as const;

  // Predefined colors for annotations apply
  const colors = [
    { value: "#000000", name: "Black" },
    { value: "#FFEB3B", name: "Yellow" },
    { value: "#4CAF50", name: "Green" },
    { value: "#2196F3", name: "Blue" },
    { value: "#F44336", name: "Red" },
    { value: "#9C27B0", name: "Purple" },
    { value: "#FF9800", name: "Orange" },
  ];

  // Filter annotations for the current page
  const currentPageAnnotations = annotations.filter(
    (a) => a.pageNumber === currentPage
  );

  // Handle custom color selection
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnnotationColor(e.target.value);
    if (currentTool === "highlight") {
      setHighlightColor(e.target.value);
    } else if (currentTool === "underline") {
      setUnderlineColor(e.target.value);
    }
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-4">Annotation Tools</h2>

      <div className="grid grid-cols-2 gap-2 mb-6 gap-3">
        {tools.map((tool) => (
          <Button
            key={tool.name}
            variant={currentTool === tool.name ? "default" : "outline"}
            className="justify-start"
            onClick={() => setCurrentTool(tool.name)}
          >
            <tool.icon className="h-4 w-4 " />
            {tool.label}
          </Button>
        ))}
      </div>

      {/* Color picker section */}
      {(currentTool === "highlight" ||
        currentTool === "underline" ||
        currentTool === "signature") && (
        <div className="my-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <PaintBucket className="h-4 w-4 mr-1" />
            Color
          </h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full border ${
                  annotationColor === color.value
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                onClick={() => {
                  setAnnotationColor(color.value);
                  if (currentTool === "highlight") {
                    setHighlightColor(color.value);
                  } else if (currentTool === "underline") {
                    setUnderlineColor(color.value);
                  }
                }}
                aria-label={`Select ${color.name} color`}
              />
            ))}
            {/* Custom color picker */}
            <div className="relative">
              <button
                className={`w-6 h-6 rounded-full border flex items-center justify-center bg-white overflow-hidden ${
                  !colors.some((c) => c.value === annotationColor)
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
                title="Custom color"
                aria-label="Select custom color"
              >
                {!colors.some((c) => c.value === annotationColor) ? (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: annotationColor }}
                  />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <input
                  type="color"
                  value={annotationColor}
                  onChange={handleCustomColorChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Pick custom color"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTool === "signature" && <SignatureCanvas />}

      {currentPageAnnotations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Annotations on this page</h3>
          <div className="space-y-2">
            {currentPageAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="flex items-center justify-between bg-accent/50 rounded p-2"
              >
                <div className="flex items-center">
                  {annotation.type === "highlight" && (
                    <Highlighter className="h-4 w-4 mr-2" />
                  )}
                  {annotation.type === "underline" && (
                    <Underline className="h-4 w-4 mr-2" />
                  )}
                  {annotation.type === "comment" && (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  {annotation.type === "signature" && (
                    <Signature className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-xs truncate max-w-[120px]">
                    {annotation.type.charAt(0).toUpperCase() +
                      annotation.type.slice(1)}
                    {annotation.id}
                    {annotation.content ? `: ${annotation.content}` : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAnnotation(annotation.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar;
