import { toast } from 'sonner';

interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  previewUrl?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

// Validate image file
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<ImageValidationResult> {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB default
    allowedTypes = ['image/webp', 'image/jpeg', 'image/png'],
    minWidth = 200,
    minHeight = 200,
    maxWidth = 2000,
    maxHeight = 2000,
  } = options;

  return new Promise((resolve) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `Invalid file type. Allowed: ${allowedTypes.map((t) => t.replace('image/', '')).join(', ')}`,
      });
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      resolve({
        valid: false,
        error: `File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
      });
      return;
    }

    // Check dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          error: `Image too small. Min dimensions: ${minWidth}x${minHeight}px`,
        });
        return;
      }

      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          valid: false,
          error: `Image too large. Max dimensions: ${maxWidth}x${maxHeight}px`,
        });
        return;
      }

      resolve({
        valid: true,
        file,
        previewUrl: objectUrl,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to load image',
      });
    };

    img.src = objectUrl;
  });
}

// Convert image to WebP
export async function convertToWebP(
  file: File,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<Blob> {
  const { quality = 0.85, maxWidth = 1200, maxHeight = 1200 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
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

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

// Upload image to server
export async function uploadImage(
  file: File,
  endpoint: string = '/api/ads/upload'
): Promise<{ url: string; srcset?: { url: string; width: number }[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

// Complete image processing pipeline
export async function processAndUploadImage(
  file: File,
  options: {
    convertToWebP?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<{ url: string; srcset?: { url: string; width: number }[] }> {
  const {
    convertToWebP: shouldConvert = true,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
  } = options;

  try {
    let processedFile = file;

    // Convert to WebP if needed and not already WebP
    if (shouldConvert && file.type !== 'image/webp') {
      const webpBlob = await convertToWebP(file, { quality, maxWidth, maxHeight });
      processedFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp',
      });
    }

    // Upload
    return await uploadImage(processedFile);
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

// Generate srcset from image URL
export function generateSrcset(
  baseUrl: string,
  widths: number[] = [400, 800, 1200]
): { url: string; width: number }[] {
  // This is a placeholder - in a real implementation,
  // you'd use an image CDN or server-side processing
  return widths.map((width) => ({
    url: baseUrl,
    width,
  }));
}
