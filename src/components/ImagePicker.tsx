import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Check, Search, Loader, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/Toast';
import { useConfirm } from './ui/ConfirmDialog';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ro: string | null;
  type: string;
  size_bytes: number | null;
  created_at: string;
}

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: { id: string; url: string; alt?: string } | null) => void;
  selectedImageId?: string | null;
  multiple?: boolean;
}

export default function ImagePicker({
  isOpen,
  onClose,
  onSelect,
  selectedImageId,
  multiple = false,
}: ImagePickerProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(selectedImageId || null);
  const [dragActive, setDragActive] = useState(false);

  const fetchMedia = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('type', 'image')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedId(selectedImageId || null);
    }
  }, [isOpen, selectedImageId, fetchMedia]);

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Invalid file type. Please upload an image file.');
    }

    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

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

    return mediaData;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      const newMedia: MediaItem[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const mediaData = await uploadFile(file);
        newMedia.push(mediaData);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      setMedia((prev) => [...newMedia, ...prev]);

      if (newMedia.length === 1) {
        setSelectedId(newMedia[0].id);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    const confirmed = await confirm({ title: 'Delete Image', message: `Delete "${item.filename}"? This cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('media_library').delete().eq('id', item.id);
      if (error) throw error;
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      if (selectedId === item.id) {
        setSelectedId(null);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete image. Please try again.');
    }
  };

  const handleSelect = (item: MediaItem) => {
    setSelectedId(item.id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      const selected = media.find((m) => m.id === selectedId);
      if (selected) {
        onSelect({
          id: selected.id,
          url: selected.url,
          alt: selected.alt_text_en || selected.filename,
        });
      }
    } else {
      onSelect(null);
    }
    onClose();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredMedia = media.filter(
    (item) =>
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt_text_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Select Image</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer min-h-[44px]">
              {uploading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto p-4 ${dragActive ? 'bg-primary/5' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {dragActive && (
            <div className="absolute inset-4 border-2 border-dashed border-primary rounded-xl flex items-center justify-center bg-primary/10 z-10">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-2 text-primary" />
                <p className="text-lg font-medium text-primary">Drop images here</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <ImageIcon className="w-12 h-12 opacity-50" />
              </div>
              <p className="font-medium mb-1">No images found</p>
              <p className="text-sm mb-4">Upload images or drag and drop them here</p>
              <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
                <Plus className="w-5 h-5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple={multiple}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedId === item.id
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.alt_text_en || item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                    {selectedId === item.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1.5">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, item)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{item.filename}</p>
                    {item.size_bytes && (
                      <p className="text-white/70 text-xs">{formatFileSize(item.size_bytes)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={() => setSelectedId(null)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={!selectedId}
          >
            Clear Selection
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors min-h-[44px]"
            >
              {selectedId ? 'Select Image' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
