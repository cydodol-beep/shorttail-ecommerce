'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { convertToWebP } from '@/lib/image-utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'logo';
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  aspectRatio = 'square',
  placeholder = 'Upload Image',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    logo: 'aspect-[3/1]',
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Max 10MB for original file (will be compressed)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to WebP format for better compression and faster loading
      const webpDataUrl = await convertToWebP(file, 0.85, 1920, 1080);
      onChange(webpDataUrl);
      setUploading(false);
    } catch (err) {
      console.error('Failed to convert image:', err);
      // Fallback to original format if WebP conversion fails
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onChange(base64);
          setUploading(false);
        };
        reader.onerror = () => {
          alert('Failed to read file');
          setUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        alert('Failed to upload image');
        setUploading(false);
      }
    }
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange('');
    onRemove?.();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-label={placeholder}
        title={placeholder}
      />

      {value ? (
        <div className={cn('relative rounded-lg overflow-hidden border border-brown-200', aspectClasses[aspectRatio])}>
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
            aspectClasses[aspectRatio],
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-brown-200 hover:border-brown-300 bg-brown-50',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-brown-400 mb-2" />
              <p className="text-sm text-brown-600">{placeholder}</p>
              <p className="text-xs text-brown-400 mt-1">Click or drag to upload</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
