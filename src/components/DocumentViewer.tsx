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


const DEFAULT_TOUCH_STATE: TouchState = {
  isDragging: false,
  lastX: 0,
  lastY: 0,
  startX: 0,
  startY: 0,
  isMultiTouch: false,
  initialDistance: 0,
  initialScale: 1,
};

// Define touch utility functions directly in the component
// Get touch coordinates relative to an element
const getTouchPosition = (
  event: React.TouchEvent | TouchEvent,
  element: HTMLElement
): { x: number; y: number } => {
  const touch = event.touches[0];
  const rect = element.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

// Calculate distance between two touch points for pinch-zoom
const getTouchDistance = (event: React.TouchEvent | TouchEvent): number => {
  if (event.touches.length < 2) return 0;

  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

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
    highlightColor,
    underlineColor,
    currentTool,
  } = useDocument();

  const [scale, setScale] = useState<number>(1.0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [touchState, setTouchState] = useState<TouchState>(DEFAULT_TOUCH_STATE);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
          viewport,
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

          if (annotation.type === "highlight") {
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
          } else if (annotation.type === "underline") {
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

  // Add touch event handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;

    if (e.touches.length === 1) {
      // Single touch - prepare for drag
      const { x, y } = getTouchPosition(e, containerRef.current);
      setTouchState((prev) => ({
        ...prev,
        isDragging: true,
        lastX: x,
        lastY: y,
        startX: x,
        startY: y,
        isMultiTouch: false,
      }));
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const initialDistance = getTouchDistance(e);
      setTouchState((prev) => ({
        ...prev,
        isMultiTouch: true,
        initialDistance,
        initialScale: scale,
      }));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    e.preventDefault(); // Prevent default to stop page scrolling

    if (touchState.isMultiTouch && e.touches.length === 2) {
      // Handle pinch zoom
      const currentDistance = getTouchDistance(e);
      if (touchState.initialDistance > 0) {
        const delta = currentDistance / touchState.initialDistance;
        const newScale = Math.min(
          Math.max(touchState.initialScale * delta, 0.5),
          3
        );
        setScale(newScale);
      }
    } else if (touchState.isDragging && e.touches.length === 1) {
      // Handle single-touch drag (for annotations or panning)
      const { x, y } = getTouchPosition(e, containerRef.current);

      // Calculate drag distance
      //const deltaX = x - touchState.lastX;
      //  const deltaY = y - touchState.lastY;

      // Update last position
      setTouchState((prev) => ({
        ...prev,
        lastX: x,
        lastY: y,
      }));

      // If currentTool is active, we'll use this for annotation creation
      if (currentTool) {
        // Touch drag logic for creating annotations will be handled by
        // the AnnotationLayer component
      }
    }
  };

  const handleTouchEnd = () => {
    // Handle single tap detection for page turning
    if (touchState.isDragging) {
      const tapDistance = Math.sqrt(
        Math.pow(touchState.lastX - touchState.startX, 2) +
          Math.pow(touchState.lastY - touchState.startY, 2)
      );

      // If it's a tap (small movement) rather than a drag
      if (tapDistance < 10) {
        const tapX = touchState.lastX;
        const containerWidth = containerRef.current?.clientWidth || 0;

        // Left side tap = previous page, right side tap = next page
        if (tapX < containerWidth * 0.3) {
          goToPreviousPage();
        } else if (tapX > containerWidth * 0.7) {
          goToNextPage();
        }
      }
    }

    // Reset touch state
    setTouchState(DEFAULT_TOUCH_STATE);
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                //isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add mobile-specific controls when on mobile */}
      {isMobile && (
        <div className="fixed bottom-5 left-0 right-0 flex justify-center gap-4 z-50">
          <Button
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            -
          </Button>
          <Button
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={zoomIn}
            disabled={scale >= 3}
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
