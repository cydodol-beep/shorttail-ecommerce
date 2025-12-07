/**
 * Converts an image file to WebP format using Canvas API
 * @param file - The original image file
 * @param quality - WebP quality (0-1), default 0.8
 * @param maxWidth - Maximum width to resize to (maintains aspect ratio)
 * @param maxHeight - Maximum height to resize to (maintains aspect ratio)
 * @returns Promise with the WebP data URL
 */
export async function convertToWebP(
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

/**
 * Converts a WebP data URL to a Blob for uploading
 * @param dataUrl - The WebP data URL
 * @returns Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Gets the file size in a human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Estimates the size of a base64 data URL
 * @param dataUrl - The data URL
 * @returns Approximate size in bytes
 */
export function estimateDataUrlSize(dataUrl: string): number {
  // Remove the data URL prefix
  const base64 = dataUrl.split(',')[1] || '';
  // Base64 encoding increases size by ~33%
  return Math.ceil((base64.length * 3) / 4);
}
