import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ro: string | null;
  type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface UploadOptions {
  folder?: string;
  onProgress?: (progress: number) => void;
}

export function useMediaLibrary() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File, options: UploadOptions = {}) => {
    const { folder = 'uploads', onProgress } = options;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      onProgress?.(10);

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      onProgress?.(70);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      const { data: mediaData, error: insertError } = await supabase
        .from('media_library')
        .insert({
          filename: file.name,
          url: urlData.publicUrl,
          type: 'image',
          size_bytes: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onProgress?.(100);

      return mediaData as MediaItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (files: FileList | File[], options: UploadOptions = {}) => {
    const { onProgress } = options;
    const fileArray = Array.from(files);
    const results: MediaItem[] = [];
    const totalFiles = fileArray.length;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];
        const result = await uploadImage(file, {
          ...options,
          onProgress: (p) => {
            const overallProgress = ((i + p / 100) / totalFiles) * 100;
            onProgress?.(overallProgress);
          },
        });
        results.push(result);
      }
      return results;
    } catch (err) {
      throw err;
    } finally {
      setUploading(false);
    }
  }, [uploadImage]);

  const deleteImage = useCallback(async (id: string) => {
    setError(null);

    try {
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      throw err;
    }
  }, []);

  const getImages = useCallback(async (options: { limit?: number; search?: string } = {}) => {
    const { limit = 50, search } = options;

    try {
      let query = supabase
        .from('media_library')
        .select('*')
        .eq('type', 'image')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (search) {
        query = query.or(`filename.ilike.%${search}%,alt_text_en.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as MediaItem[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(message);
      throw err;
    }
  }, []);

  const getImageById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      return data as MediaItem | null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch image';
      setError(message);
      throw err;
    }
  }, []);

  const updateAltText = useCallback(async (id: string, altTextEn: string, altTextRo?: string) => {
    setError(null);

    try {
      const { error } = await supabase
        .from('media_library')
        .update({
          alt_text_en: altTextEn,
          alt_text_ro: altTextRo,
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
      throw err;
    }
  }, []);

  return {
    uploading,
    error,
    uploadImage,
    uploadMultiple,
    deleteImage,
    getImages,
    getImageById,
    updateAltText,
  };
}
