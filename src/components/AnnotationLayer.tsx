import React, { useEffect, useRef, useState } from "react";
import { Annotation, useDocument } from "@/contexts/DocumentContext";
import CommentDialog from "./CommentDialog";

interface AnnotationLayerProps {
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
 // isMobile?: boolean;
}

// Resize handle positions
const RESIZE_HANDLES = ["nw", "ne", "sw", "se"];

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNumber,
  scale,
  width,
  height,
//  isMobile = false,
}) => {
  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    currentTool,
    activeAnnotation,
    setActiveAnnotation,
    highlightColor,
    underlineColor,
  } = useDocument();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(
    null
  );
  const [initialDragPos, setInitialDragPos] = useState({ x: 0, y: 0 });
  const [resizingAnnotation, setResizingAnnotation] = useState<string | null>(
    null
  );
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });

  // Handle clicks outside of annotations to clear active state
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;

      // If clicking on container directly (not on an annotation)
      if (e.target === containerRef.current && activeAnnotation) {
        setActiveAnnotation(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeAnnotation, setActiveAnnotation]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Clear active annotation if clicking directly on the container
    if (e.target === containerRef.current && activeAnnotation) {
      setActiveAnnotation(null);
    }

    if (!currentTool || currentTool === "select") return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDrawing(true);
    setStartPosition({ x, y });
    setCurrentPosition({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing && !draggedAnnotation && !resizingAnnotation) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (isDrawing) {
      setCurrentPosition({ x, y });
    } else if (draggedAnnotation) {
      const deltaX = x - initialDragPos.x;
      const deltaY = y - initialDragPos.y;

      const annotation = annotations.find((a) => a.id === draggedAnnotation);
      if (annotation) {
        updateAnnotation(draggedAnnotation, {
          ...annotation,
          position: {
            ...annotation.position,
            x: annotation.position.x + deltaX,
            y: annotation.position.y + deltaY,
          },
        });
        setInitialDragPos({ x, y });
      }
    } else if (resizingAnnotation && resizeHandle) {
      const annotation = annotations.find((a) => a.id === resizingAnnotation);

      if (annotation) {
        let newX = annotation.position.x;
        let newY = annotation.position.y;
        let newWidth = annotation.position.width || 0;
        let newHeight = annotation.position.height || 0;

        // Handle resize based on which handle is dragged
        switch (resizeHandle) {
          case "nw": // Top-left
            newX = x;
            newY = y;
            newWidth =
              annotation.position.x + (annotation.position.width || 0) - x;
            newHeight =
              annotation.position.y + (annotation.position.height || 0) - y;
            break;
          case "ne": // Top-right
            newY = y;
            newWidth = x - annotation.position.x;
            newHeight =
              annotation.position.y + (annotation.position.height || 0) - y;
            break;
          case "sw": // Bottom-left
            newX = x;
            newWidth = y;
            break;
          case "se": // Bottom-right
            newWidth = x - annotation.position.x;
            newHeight = y - annotation.position.y;
            break;
        }

        // Ensure minimum size
        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;

        updateAnnotation(resizingAnnotation, {
          ...annotation,
          position: {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          },
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing && !draggedAnnotation && !resizingAnnotation) {
      return;
    }

    if (isDrawing) {
      if (!currentTool || currentTool === "select") {
        setIsDrawing(false);
        return;
      }

      // Minimum size check to avoid accidental clicks
      const width = Math.abs(currentPosition.x - startPosition.x);
      const height = Math.abs(currentPosition.y - startPosition.y);

      if (width < 5 && height < 5) {
        setIsDrawing(false);
        return;
      }

      // Create annotation based on current tool
      if (currentTool === "highlight" || currentTool === "underline") {
        addAnnotation({
          type: currentTool,
          pageNumber,
          position: {
            x: Math.min(startPosition.x, currentPosition.x),
            y: Math.min(startPosition.y, currentPosition.y),
            width,
            height,
          },
          color: currentTool === "highlight" ? "yellow" : "blue",
        });
      } else if (currentTool === "comment") {
        // Open comment dialog instead of using prompt()
        setCommentPosition({
          x: Math.min(startPosition.x, currentPosition.x),
          y: Math.min(startPosition.y, currentPosition.y),
        });
        setIsCommentDialogOpen(true);
      }
    }

    setIsDrawing(false);
    setDraggedAnnotation(null);
    setResizingAnnotation(null);
    setResizeHandle(null);
  };

  const startDragging = (e: React.MouseEvent, annotationId: string) => {
    if (currentTool !== "select") return;

    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Set this annotation as active
    const annotation = annotations.find((a) => a.id === annotationId);
    setActiveAnnotation(annotation || null);

    setDraggedAnnotation(annotationId);
    setInitialDragPos({ x, y });
  };

  const startResizing = (
    e: React.MouseEvent,
    annotationId: string,
    handle: string
  ) => {
    if (currentTool !== "select") return;

    e.stopPropagation();

    // Make sure this annotation is active
    const annotation = annotations.find((a) => a.id === annotationId);
    setActiveAnnotation(annotation || null);

    setResizingAnnotation(annotationId);
    setResizeHandle(handle);
  };

  // Get displayable annotation labels
  const getAnnotationLabel = (type: string, id: string): string => {
    switch (type) {
      case "highlight":
        return "Highlight";
      case "underline":
        return "Underline";
      case "comment":
        return "Comment";
      case "signature":
        return "Signature";
      default:
        return `Annotation ${id.substring(0, 4)}`;
    }
  };

  // Filter annotations for this page
  const currentPageAnnotations = annotations.filter(
    (annotation) => annotation.pageNumber === pageNumber
  );

  // Handler for comment submission
  const handleCommentSubmit = (content: string) => {
    addAnnotation({
      type: "comment",
      pageNumber,
      content,
      position: commentPosition,
    });
    setIsCommentDialogOpen(false);
  };

  // Touch event handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !e.touches[0]) return;

    // Prevent default to avoid scrolling while annotating
    if (currentTool && currentTool !== 'select') {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;

    if (currentTool && currentTool !== 'select') {
      setIsDrawing(true);
      setStartPosition({ x, y });
      setCurrentPosition({ x, y });
    } else if (currentTool === 'select') {
      // Check if we're touching an existing annotation for dragging
      const annotationUnderTouch = findAnnotationAtPosition(x, y);
      if (annotationUnderTouch) {
        setActiveAnnotation(annotationUnderTouch);
        setDraggedAnnotation(annotationUnderTouch.id);
        setInitialDragPos({ x, y });
        e.preventDefault(); // Prevent scrolling while dragging
      } else if (activeAnnotation) {
        // Check if we're touching a resize handle
        const handleTouched = findResizeHandleAtPosition(x, y, activeAnnotation);
        if (handleTouched) {
          setResizingAnnotation(activeAnnotation.id);
          setResizeHandle(handleTouched);
          e.preventDefault(); // Prevent scrolling while resizing
        } else {
          setActiveAnnotation(null);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !e.touches[0]) return;

    // Always prevent default during annotation actions to avoid page scrolling
    if (isDrawing || draggedAnnotation || resizingAnnotation) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;

    if (isDrawing) {
      setCurrentPosition({ x, y });
    } else if (draggedAnnotation) {
      const deltaX = x - initialDragPos.x;
      const deltaY = y - initialDragPos.y;
      
      const annotation = annotations.find(a => a.id === draggedAnnotation);
      if (annotation) {
        updateAnnotation(draggedAnnotation, {
          ...annotation,
          position: {
            ...annotation.position,
            x: annotation.position.x + deltaX,
            y: annotation.position.y + deltaY,
          },
        });
        setInitialDragPos({ x, y });
      }
    } else if (resizingAnnotation && resizeHandle) {
      // Handle resize - similar to mouse resize logic
      const annotation = annotations.find(a => a.id === resizingAnnotation);
      if (annotation) {
        let newX = annotation.position.x;
        let newY = annotation.position.y;
        let newWidth = annotation.position.width || 0;
        let newHeight = annotation.position.height || 0;

        // Use the same resize logic as for mouse
        switch (resizeHandle) {
          case "nw": // Top-left
            newX = x;
            newY = y;
            newWidth = annotation.position.x + (annotation.position.width || 0) - x;
            newHeight = annotation.position.y + (annotation.position.height || 0) - y;
            break;
          case "ne": // Top-right
            newY = y;
            newWidth = x - annotation.position.x;
            newHeight = annotation.position.y + (annotation.position.height || 0) - y;
            break;
          case "sw": // Bottom-left
            newX = x;
            newWidth = annotation.position.x + (annotation.position.width || 0) - x;
            newHeight = y - annotation.position.y;
            break;
          case "se": // Bottom-right
            newWidth = x - annotation.position.x;
            newHeight = y - annotation.position.y;
            break;
        }

        // Ensure minimum size
        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;

        updateAnnotation(resizingAnnotation, {
          ...annotation,
          position: {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          },
        });
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDrawing) {
      // Similar to mouse up, create annotation if we were drawing
      if (!currentTool || currentTool === "select") {
        setIsDrawing(false);
        return;
      }

      // Minimum size check to avoid accidental taps
      const width = Math.abs(currentPosition.x - startPosition.x);
      const height = Math.abs(currentPosition.y - startPosition.y);

      if (width < 5 && height < 5) {
        // For tiny movements, treat as tap
        if (currentTool === "comment") {
          // Handle comment creation on tap
          setCommentPosition({
            x: startPosition.x,
            y: startPosition.y,
          });
          setIsCommentDialogOpen(true);
        }
        setIsDrawing(false);
        return;
      }

      // Create annotation based on current tool
      if (currentTool === "highlight" || currentTool === "underline") {
        addAnnotation({
          type: currentTool,
          pageNumber,
          position: {
            x: Math.min(startPosition.x, currentPosition.x),
            y: Math.min(startPosition.y, currentPosition.y),
            width,
            height,
          },
          color: currentTool === "highlight" ? highlightColor : underlineColor,
        });
      } else if (currentTool === "comment") {
        setCommentPosition({
          x: Math.min(startPosition.x, currentPosition.x),
          y: Math.min(startPosition.y, currentPosition.y),
        });
        setIsCommentDialogOpen(true);
      }
    }

    setIsDrawing(false);
    setDraggedAnnotation(null);
    setResizingAnnotation(null);
    setResizeHandle(null);
  };

  // Helper to find if a touch is on an annotation
  const findAnnotationAtPosition = (x: number, y: number) => {
    // Scan annotations in reverse order to get the top-most one first
    for (let i = currentPageAnnotations.length - 1; i >= 0; i--) {
      const annotation = currentPageAnnotations[i];
      
      // Check if point is inside annotation bounds
      if (
        x >= annotation.position.x &&
        x <= annotation.position.x + (annotation.position.width || 0) &&
        y >= annotation.position.y &&
        y <= annotation.position.y + (annotation.position.height || 0)
      ) {
        return annotation;
      }
    }
    return null;
  };

  // Helper to find if a touch is on a resize handle
  const findResizeHandleAtPosition = (
    x: number,
    y: number,
    annotation: Annotation
  ) => {
    if (!annotation) return null;

    // Check each handle position
    const handleSize = 15 / scale; // Make the touch target bigger than visual size
    const positions = {
      nw: {
        x: annotation.position.x,
        y: annotation.position.y,
      },
      ne: {
        x: annotation.position.x + (annotation.position.width || 0),
        y: annotation.position.y,
      },
      sw: {
        x: annotation.position.x,
        y: annotation.position.y + (annotation.position.height || 0),
      },
      se: {
        x: annotation.position.x + (annotation.position.width || 0),
        y: annotation.position.y + (annotation.position.height || 0),
      },
    };

    for (const handle of RESIZE_HANDLES) {
      const pos = positions[handle as keyof typeof positions];
      if (
        Math.abs(x - pos.x) < handleSize / 2 &&
        Math.abs(y - pos.y) < handleSize / 2
      ) {
        return handle;
      }
    }
    return null;
  };

  return (
    <>
      <div
        ref={containerRef}
        className="absolute top-0 left-0 select-none pointer-events-auto"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render existing annotations */}
        {currentPageAnnotations.map((annotation) => {
          const position = {
            x: annotation.position.x * scale,
            y: annotation.position.y * scale,
            width: (annotation.position.width || 0) * scale,
            height: (annotation.position.height || 0) * scale,
          };

          const isActive = activeAnnotation?.id === annotation.id;
          const isDragging = draggedAnnotation === annotation.id;
          const isResizing = resizingAnnotation === annotation.id;
          const showLabel = isActive || isDragging || isResizing;

          if (annotation.type === "highlight") {
            return (
              <div
                key={annotation.id}
                className="absolute"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                }}
              >
                <div
                  //  className="bg-yellow-300/30"
                  style={{
                    width: `${position.width}px`,
                    height: `${position.height}px`,
                    zIndex: 10,
                    backgroundColor: highlightColor,
                    backdropFilter: "opacity(10%)",
                    opacity: 0.3,
                  }}
                />
                {showLabel && (
                  <div className="absolute top-0 left-0 transform -translate-y-full bg-yellow-500 text-white text-xs px-1 py-0.5 rounded shadow">
                    {getAnnotationLabel("highlight", annotation.id)}
                    {annotation.id}
                  </div>
                )}
              </div>
            );
          }

          if (annotation.type === "underline") {
            return (
              <div
                key={annotation.id}
                className="absolute"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y + (position.height || 0) - 2}px`,
                }}
              >
                <div
                  //  className="bg-blue-500"
                  style={{
                    width: `${position.width}px`,
                    height: "2px",
                    zIndex: 10,
                    backgroundColor: underlineColor,
                  }}
                />
                {showLabel && (
                  <div className="absolute top-0 left-0 transform -translate-y-full bg-blue-500 text-white text-xs px-1 py-0.5 rounded shadow">
                    {getAnnotationLabel("underline", annotation.id)}
                  </div>
                )}
              </div>
            );
          }

          if (annotation.type === "comment") {
            return (
              <div
                key={annotation.id}
                className="absolute"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  zIndex: 20,
                }}
              >
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-xs">i</span>
                </div>
                {showLabel && (
                  <div className="absolute top-0 left-0 transform -translate-y-full bg-blue-500 text-white text-xs px-1 py-0.5 rounded shadow">
                    {getAnnotationLabel("comment", annotation.id)}
                  </div>
                )}
              </div>
            );
          }

          if (annotation.type === "signature") {
            return (
              <div
                key={annotation.id}
                className={`absolute ${
                  currentTool === "select" ? "cursor-move" : "cursor-default"
                }`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${position.width}px`,
                  height: `${position.height}px`,
                  zIndex: 15,
                  ...(isActive ? { border: "2px solid #2563eb" } : {}),
                }}
                onMouseDown={(e) => startDragging(e, annotation.id)}
              >
                <img
                  src={annotation.imageData}
                  alt="Signature"
                  className="w-full h-full object-contain"
                  draggable={false}
                />

                {/* Label for signature */}
                {showLabel && (
                  <div className="absolute top-0 left-0 transform -translate-y-full bg-gray-800 text-white text-xs px-1 py-0.5 rounded shadow z-30">
                    {getAnnotationLabel("signature", annotation.id)}
                  </div>
                )}

                {/* Resize handles */}
                {isActive &&
                  currentTool === "select" &&
                  RESIZE_HANDLES.map((handle) => {
                    let handleStyle: React.CSSProperties = {
                      width: "12px",
                      height: "12px",
                      backgroundColor: "white",
                      border: "2px solid #2563eb",
                      borderRadius: "50%",
                      position: "absolute",
                      zIndex: 25,
                    };

                    // Position each handle at its corner
                    switch (handle) {
                      case "nw": // Top-left
                        handleStyle = {
                          ...handleStyle,
                          top: "-6px",
                          left: "-6px",
                          cursor: "nwse-resize",
                        };
                        break;
                      case "ne": // Top-right
                        handleStyle = {
                          ...handleStyle,
                          top: "-6px",
                          right: "-6px",
                          cursor: "nesw-resize",
                        };
                        break;
                      case "sw": // Bottom-left
                        handleStyle = {
                          ...handleStyle,
                          bottom: "-6px",
                          left: "-6px",
                          cursor: "nesw-resize",
                        };
                        break;
                      case "se": // Bottom-right
                        handleStyle = {
                          ...handleStyle,
                          bottom: "-6px",
                          right: "-6px",
                          cursor: "nwse-resize",
                        };
                        break;
                    }

                    return (
                      <div
                        key={handle}
                        style={handleStyle}
                        onMouseDown={(e) =>
                          startResizing(e, annotation.id, handle)
                        }
                      />
                    );
                  })}
              </div>
            );
          }

          return null;
        })}

        {/* Drawing preview */}
        {isDrawing &&
          (currentTool === "highlight" || currentTool === "underline") && (
            <div
              className={`absolute`}
              style={{
                ...(currentTool === "highlight"
                  ? {
                      backgroundColor: highlightColor,
                      opacity: 0.5,
                    }
                  : {
                      borderBottom: `2px solid ${underlineColor}`,
                    }),

                left: Math.min(startPosition.x, currentPosition.x) * scale,
                top:
                  currentTool === "highlight"
                    ? Math.min(startPosition.y, currentPosition.y) * scale
                    : Math.max(startPosition.y, currentPosition.y) * scale,
                width: Math.abs(currentPosition.x - startPosition.x) * scale,
                height:
                  currentTool === "highlight"
                    ? Math.abs(currentPosition.y - startPosition.y) * scale
                    : 0,
              }}
            />
          )}
      </div>

      {/* Comment Dialog */}
      <CommentDialog
        isOpen={isCommentDialogOpen}
        onClose={() => setIsCommentDialogOpen(false)}
        onSubmit={handleCommentSubmit}
      />
    </>
  );
};

export default AnnotationLayer;
