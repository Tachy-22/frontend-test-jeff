import React, { useState, useEffect, useRef } from "react";
import { useDocument } from "@/contexts/DocumentContext";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader,
  FileUp,
} from "lucide-react";
import AnnotationLayer from "@/components/AnnotationLayer";
import { toast } from "@/hooks/use-toast";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { convertColorToRgb } from "@/lib/utils";

// We need to specify the worker source, but we're using legacy build to avoid Node.js dependencies
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DocumentViewer: React.FC = () => {
  const {
    file,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    annotations,
    isExporting,
    setIsExporting,
    setFile, // We'll use this to reset the file,,
    setAnnotations,
    setActiveAnnotation,
    ///  annotationColor,
    highlightColor,
    underlineColor,
    currentTool,
  } = useDocument();

  const [scale, setScale] = useState<number>(1.0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the PDF document using PDF.js
  useEffect(() => {
    if (!file) return;

    setIsLoading(true);

    const loadPdf = async () => {
      try {
        const fileArrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
        const pdf = await loadingTask.promise;

        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load PDF:", error);
        toast({
          title: "Error loading PDF",
          description: "Could not load the PDF file. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      // Cleanup
      setPdfDocument(null);
    };
  }, [file, setCurrentPage, setTotalPages]);

  // Render current page when page number or scale changes
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setIsLoading(true);

        // Get the page
        const page = await pdfDocument.getPage(currentPage);

        // Get any rotation metadata from the PDF page
        const rotation = page.rotate || 0;

        // Set viewport and canvas - properly handle rotation
        // Don't negate the rotation, instead use it directly
        // PDF.js will handle the rotation correctly
        const viewport = page.getViewport({
          scale,
          rotation: rotation, // Use the actual rotation value from the PDF
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Set to high quality rendering - use device pixel ratio for higher resolution
        const pixelRatio = window.devicePixelRatio || 1;
        const scaledViewport = page.getViewport({
          scale: scale * pixelRatio,
          rotation: rotation,
        });

        // Update canvas dimensions with pixel ratio for higher quality
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Set display size to maintain aspect ratio
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Store dimensions for annotation layer
        setPageWidth(viewport.width);
        setPageHeight(viewport.height);

        // Reset transform and clear canvas
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Apply pixel ratio scale for high DPI displays
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        // Render the page with proper orientation and high quality
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          renderInteractiveForms: true,
          enableWebGL: true,
          // Use high quality rendering
          canvasFactoryFactory: {
            create: (_) => {
              return {
                create: (width, height) => {
                  const newCanvas = document.createElement("canvas");
                  newCanvas.width = width;
                  newCanvas.height = height;
                  return newCanvas;
                },
              };
            },
          },
        }).promise;

        setIsLoading(false);
      } catch (error) {
        console.error("Error rendering page:", error);
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  const exportDocument = async () => {
    if (!file) return;

    try {
      setIsExporting(true);
      toast({
        title: "Exporting document",
        description: "Please wait while we prepare your document for download",
      });

      // Read the PDF file
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      // Process annotations by page
      const annotationsByPage = new Map<number, typeof annotations>();

      annotations.forEach((annotation) => {
        const pageAnnotations =
          annotationsByPage.get(annotation.pageNumber) || [];
        pageAnnotations.push(annotation);
        annotationsByPage.set(annotation.pageNumber, pageAnnotations);
      });

      // Apply annotations to each page
      for (const [pageNum, pageAnnotations] of Array.from(
        annotationsByPage.entries()
      )) {
        // PDF page numbers are 0-based, our app uses 1-based indexing
        const pdfPage = pages[pageNum - 1];
        if (!pdfPage) continue;

        const { height } = pdfPage.getSize();

        for (const annotation of pageAnnotations) {
          const scaleFactor = 1.0;

          if (currentTool === "highlight") {
            pdfPage.drawRectangle({
              x: annotation.position.x * scaleFactor,
              y:
                height -
                (annotation.position.y + (annotation.position.height || 0)) *
                  scaleFactor,
              width: (annotation.position.width || 0) * scaleFactor,
              height: (annotation.position.height || 0) * scaleFactor,
              color: convertColorToRgb(highlightColor),
              opacity: 0.3,
            });
          } else if (currentTool === "underline") {
            // Fix underline rendering
            pdfPage.drawLine({
              start: {
                x: annotation.position.x * scaleFactor,
                y:
                  height -
                  (annotation.position.y + (annotation.position.height || 0)) *
                    scaleFactor,
              },
              end: {
                x:
                  (annotation.position.x + (annotation.position.width || 0)) *
                  scaleFactor,
                y:
                  height -
                  (annotation.position.y + (annotation.position.height || 0)) *
                    scaleFactor,
              },
              thickness: 2,
              color: convertColorToRgb(underlineColor),
              opacity: 0.8,
            });
          } else if (annotation.type === "comment") {
            // Implement comment rendering

            pdfPage.drawCircle({
              x: annotation.position.x * scaleFactor + 10,
              y: height - annotation.position.y * scaleFactor - 10,
              size: 12,
              color: rgb(0, 0.5, 1),
            });

            if (annotation.content) {
              pdfPage.drawText(annotation.content, {
                x: annotation.position.x * scaleFactor + 25,
                y: height - annotation.position.y * scaleFactor - 10,
                size: 10,
                //  font,
                color: rgb(0, 0, 0),
              });
            }
          } else if (annotation.type === "signature" && annotation.imageData) {
            try {
              // Process signature image
              const base64Data = annotation.imageData.split(",")[1];
              if (!base64Data) continue;

              const signatureBytes = base64ToUint8Array(base64Data);
              const signatureImage = await pdfDoc.embedPng(signatureBytes);

              const signatureDims = signatureImage.scale(1);
              const maxWidth = (annotation.position.width || 200) * scaleFactor;
              const maxHeight =
                (annotation.position.height || 100) * scaleFactor;

              let signatureWidth = signatureDims.width;
              let signatureHeight = signatureDims.height;

              // Scale the signature to fit
              if (signatureWidth > maxWidth) {
                const ratio = maxWidth / signatureWidth;
                signatureWidth = maxWidth;
                signatureHeight = signatureHeight * ratio;
              }

              if (signatureHeight > maxHeight) {
                const ratio = maxHeight / signatureHeight;
                signatureHeight = maxHeight;
                signatureWidth = signatureWidth * ratio;
              }

              // Draw the signature on the page
              pdfPage.drawImage(signatureImage, {
                x: annotation.position.x * scaleFactor,
                y:
                  height -
                  annotation.position.y * scaleFactor -
                  signatureHeight,
                width: signatureWidth,
                height: signatureHeight,
              });
            } catch (error) {
              console.error("Error embedding signature:", error);
              toast({
                title: "Error with signature",
                description: "Failed to add signature to the PDF",
                variant: "destructive",
              });
            }
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `annotated-${file.name}`;
      link.click();

      toast({
        title: "Export complete",
        description: "Your annotated document has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting document:", error);
      toast({
        title: "Export failed",
        description: "Failed to export the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleNewFile = () => {
    // Reset the file to trigger the upload screen
    setFile(null);
    setAnnotations([]);
    setActiveAnnotation(null);
  };

  if (!file) return null;

  return (
    <div className="flex flex-col">
      <div className="flex lg:flex-row flex-col-reverse justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center lg:justify-start justify-between w-full gap-2">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
            >
              -
            </Button>

            <span className="text-sm">{Math.round(scale * 100)}%</span>

            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3}
            >
              +
            </Button>
          </div>

          <div className="w-full flex gap-3 items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewFile}
              className="ml-2"
            >
              <FileUp className="h-4 w-4 " />
              New File
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={exportDocument}
              disabled={isExporting}
              className="ml-2"
            >
              {isExporting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin " />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto bg-accent/20 relative">
        <div
          ref={containerRef}
          className="min-h-[800px] flex justify-start items-start lg:justify-center relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <div className="relative">
            <canvas ref={canvasRef} className="shadow-md" />
            <div
              className="absolute top-0 left-0"
              style={{ width: pageWidth, height: pageHeight }}
            >
              <AnnotationLayer
                pageNumber={currentPage}
                scale={scale}
                width={pageWidth}
                height={pageHeight}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
