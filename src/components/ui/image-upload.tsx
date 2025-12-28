'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertImageToWebP } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (file: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  className = '',
  quality = 0.8,
  maxWidth = 1920,
  maxHeight = 1080,
  aspectRatio,
  placeholder,
  ...props
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, TIFF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to WebP format
      const webPDataUrl = await convertImageToWebP(file, quality, maxWidth, maxHeight);
      onChange(webPDataUrl);
      setPreviewUrl(webPDataUrl);
    } catch (error) {
      console.error('Error converting image to WebP:', error);
      alert('Error converting image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileChange(file);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onChange('');
    if (onRemove) onRemove();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging 
            ? 'border-accent bg-accent/10' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/jpeg,image/jpg,image/png,image/tiff,image/webp"
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-accent mb-3" />
            <p className="text-gray-600">Converting image to WebP...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-64 w-full object-contain rounded-lg border border-gray-200"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 rounded-full h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-600 mb-1">Click or drag an image file to upload</p>
            <p className="text-sm text-gray-500">Supports JPEG, PNG, TIFF (Max 5MB)</p>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}