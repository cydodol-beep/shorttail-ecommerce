import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Validate if a string is a proper data URL
export function isValidDataUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const dataUrlPattern = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/i;
    return dataUrlPattern.test(url);
  } catch {
    return false;
  }
}
