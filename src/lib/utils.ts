import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Validate if a string is a proper data URL
export function isValidDataUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    // Check if it's a well-formed data URL
    const dataUrlPattern = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/i;
    return dataUrlPattern.test(url);
  } catch {
    return false;
  }
}

// Specifically validate WebP data URL format
export function isValidWebPDataUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    // Check if it's a well-formed WebP data URL
    const webpDataUrlPattern = /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/i;

    if (!webpDataUrlPattern.test(url)) {
      return false;
    }

    // Additional check: make sure it's not extremely large, which could cause issues
    // Base64 encoded images are about 4/3 larger than the original, so 4MB original would be ~5.3MB in base64
    if (url.length > 8 * 1024 * 1024) { // 8MB limit (base64 would be ~6MB for ~4.5MB image)
      console.warn('Avatar data URL is too large:', url.length, 'characters');
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
