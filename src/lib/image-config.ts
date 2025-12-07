// Next.js Image Optimization Configuration
// This file configures image optimization settings for better performance

export const imageConfig = {
  // Supported image formats
  formats: ['image/webp', 'image/avif'],
  
  // Device sizes for responsive images
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  
  // Image sizes for responsive images
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  
  // Domains allowed for image optimization
  domains: ['supabase.co', 'amazonaws.com'],
  
  // Loader for custom image CDN
  loader: 'default',
  
  // Quality for optimized images (1-100)
  quality: 75,
};

// Helper function to generate responsive image sizes
export function getImageSizes(maxWidth: number = 1200) {
  return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${maxWidth}px`;
}

// Helper to optimize product images
export function getOptimizedImageUrl(url: string, width: number = 800, quality: number = 75) {
  if (!url) return '';
  
  // If using Supabase storage, add transformation params
  if (url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}`;
  }
  
  return url;
}
