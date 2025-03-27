// A utility to handle touch events for annotations

// Track touch state
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

export const createTouchState = (): TouchState => ({
  isDragging: false,
  lastX: 0,
  lastY: 0,
  startX: 0,
  startY: 0,
  isMultiTouch: false,
  initialDistance: 0,
  initialScale: 1,
});

// Get touch coordinates relative to an element
export const getTouchPosition = (
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
export const getTouchDistance = (event: React.TouchEvent | TouchEvent): number => {
  if (event.touches.length < 2) return 0;
  
  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Convert touch event to mouse event coordinates
export const touchToMousePosition = (
  touch: Touch,
  element: HTMLElement
): { clientX: number; clientY: number } => {
  const rect = element.getBoundingClientRect();
  return {
    clientX: touch.clientX - rect.left,
    clientY: touch.clientY - rect.top,
  };
};
