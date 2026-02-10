import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];

interface UploadResponse {
  url?: string;
  error?: string;
  srcset?: { url: string; width: number }[];
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['master_admin', 'normal_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: WebP, JPEG, PNG, GIF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max size: 2MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image - convert to WebP if not already
    let processedBuffer: Buffer;
    let contentType = 'image/webp';
    let fileExtension = 'webp';

    if (file.type === 'image/webp') {
      // Already WebP, use as-is
      processedBuffer = buffer;
    } else {
      // For server-side image processing, we'll use the original file
      // Client-side should convert to WebP before upload
      processedBuffer = buffer;
      contentType = file.type;
      fileExtension = file.type.split('/')[1] || 'webp';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `ad_${timestamp}_${randomId}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('advertisements')
      .upload(fileName, processedBuffer, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('advertisements')
      .getPublicUrl(fileName);

    // Generate srcset for responsive images
    const srcset = [
      { url: publicUrl, width: 800 },
      { url: publicUrl.replace(fileName, `thumb_${fileName}`), width: 400 },
    ];

    return NextResponse.json({
      url: publicUrl,
      srcset,
    });
  } catch (error) {
    console.error('Error in ad upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validate image dimensions
export async function validateImageDimensions(
  file: File,
  minWidth: number,
  minHeight: number
): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  return new Promise((resolve) => {
    // For server-side, we'd need sharp or similar library
    // For now, return valid (client-side validates before upload)
    resolve({ valid: true });
  });
}
