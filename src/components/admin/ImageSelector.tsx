import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Check, Search, Folder } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ro: string | null;
  type: string;
  folder: string | null;
  created_at: string;
}

interface ImageSelectorProps {
  value: string | null;
  onChange: (items: { id: string; url: string }[]) => void;
  onClose: () => void;
  suggestedFolder?: string;
  multiple?: boolean;
}

export default function ImageSelector({ value, onChange, onClose, suggestedFolder, multiple = false }: ImageSelectorProps) {
  const toast = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: string; url: string }[]>([]);
  const [folderFilter, setFolderFilter] = useState<string>(suggestedFolder || 'all');
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('type', 'image')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);

      const existingFolders = (data || [])
        .map((item: MediaItem) => item.folder)
        .filter((f: string | null): f is string => f !== null);
      setFolders([...new Set(existingFolders)] as string[]);

      if (value) {
        const initialSelected = (data || [])
          .filter((m: MediaItem) => value.split(',').includes(m.id))
          .map((m: MediaItem) => ({ id: m.id, url: m.url }));
        setSelectedItems(initialSelected);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

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

      setMedia([mediaData, ...media]);
      const newItem = { id: mediaData.id, url: mediaData.url };
      if (multiple) {
        setSelectedItems([...selectedItems, newItem]);
      } else {
        setSelectedItems([newItem]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      const isSelected = selectedItems.some((i) => i.id === item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, { id: item.id, url: item.url }]);
      }
    } else {
      setSelectedItems([{ id: item.id, url: item.url }]);
    }
  };

  const handleConfirm = () => {
    onChange(selectedItems);
    onClose();
  };

  const filteredMedia = media.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt_text_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt_text_ro?.toLowerCase().includes(searchQuery.toLowerCase());

    if (folderFilter === 'all') return matchesSearch;
    if (folderFilter === 'uncategorized') return matchesSearch && !item.folder;
    return matchesSearch && item.folder === folderFilter;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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

        <div className="p-4 border-b space-y-3">
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
            <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {folders.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Folder className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setFolderFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  folderFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {suggestedFolder && folders.includes(suggestedFolder) && (
                <button
                  onClick={() => setFolderFilter(suggestedFolder)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    folderFilter === suggestedFolder
                      ? 'bg-primary text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {suggestedFolder} (suggested)
                </button>
              )}
              {folders
                .filter((f) => f !== suggestedFolder)
                .map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setFolderFilter(folder)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      folderFilter === folder
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {folder}
                  </button>
                ))}
              <button
                onClick={() => setFolderFilter('uncategorized')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  folderFilter === 'uncategorized'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Uncategorized
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>No images found</p>
              <p className="text-sm">Upload an image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMedia.map((item) => {
                const isSelected = selectedItems.some((i) => i.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.alt_text_en || item.filename}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedItems([])}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
            {selectedItems.length > 0 && (
              <span className="text-sm font-medium text-primary">
                {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {multiple ? `Select ${selectedItems.length} ${selectedItems.length === 1 ? 'Image' : 'Images'}` : 'Select Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
