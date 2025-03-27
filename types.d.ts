type TouchState = {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
  isMultiTouch: boolean;
  initialDistance: number;
  initialScale: number;
};


interface AnnotationLayerProps {
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
  // isMobile?: boolean;
}