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
  if (!url) {
    console.debug('Avatar URL validation failed: URL is null/undefined');
    return false;
  }

  try {
    // Log the first 50 characters to help with debugging
    console.debug('Validating WebP URL:', url.substring(0, 50) + '...');

    // Check if it's a well-formed WebP data URL
    const webpDataUrlPattern = /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/i;

    if (!webpDataUrlPattern.test(url)) {
      console.error('Avatar URL validation failed: Does not match WebP pattern');
      console.error('Pattern:', webpDataUrlPattern);
      console.error('URL starts with:', url.substring(0, 100));
      return false;
    }

    // Additional check: make sure it's not extremely large, which could cause issues
    if (url.length > 8 * 1024 * 1024) { // 8MB limit
      console.warn('Avatar data URL is too large:', url.length, 'characters');
      return false;
    }

    console.debug('Avatar URL validation passed');
    return true;
  } catch (error) {
    console.error('Avatar URL validation error:', error);
    return false;
  }
}

// Function to extract info from data URL for debugging
export function getAvatarDataInfo(url: string | undefined | null): { isValid: boolean; length: number; prefix: string } {
  if (!url) {
    return { isValid: false, length: 0, prefix: 'null' };
  }

  return {
    isValid: isValidWebPDataUrl(url),
    length: url.length,
    prefix: url.substring(0, 30)
  };
}

// Convert an image file to WebP format with specified quality
export function convertImageToWebP(
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP
      const webpDataUrl = canvas.toDataURL('image/webp', quality);

      // Clean up
      URL.revokeObjectURL(img.src);

      resolve(webpDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    // Create object URL from file and load it
    img.src = URL.createObjectURL(file);
  });
}
