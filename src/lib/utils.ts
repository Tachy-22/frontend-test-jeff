import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { rgb } from "pdf-lib";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertColorToRgb = (color: string) => {
  // Handle hex colors
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  }
  // Handle rgb/rgba strings
  else if (color.startsWith("rgb")) {
    const match = color.match(/\d+\.?\d*/g);
    if (match && match.length >= 3) {
      const r = parseFloat(match[0]) / 255;
      const g = parseFloat(match[1]) / 255;
      const b = parseFloat(match[2]) / 255;
      return rgb(r, g, b);
    }
  }
  // Default fallback
  return rgb(0, 0, 0);
};
