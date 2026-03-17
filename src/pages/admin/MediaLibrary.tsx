import { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  X,
  Search,
  Grid,
  List,
  Download,
  Eye,
  FileVideo,
  FileText,
  Plus,
  Images,
  ShoppingBag,
  FileImage,
  BookOpen,
  MessageSquareQuote,
  Users,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';

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
  folder: string | null;
  created_at: string;
}

interface UsageLocation {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const USAGE_LOCATIONS: UsageLocation[] = [
  { id: 'hero', label: 'Hero Section', icon: <ImageIcon className="w-5 h-5" />, description: 'Main banner images' },
  { id: 'gallery', label: 'Photo Gallery', icon: <Images className="w-5 h-5" />, description: 'Gallery slideshows' },
  { id: 'products', label: 'Products', icon: <ShoppingBag className="w-5 h-5" />, description: 'Menu item photos' },
  { id: 'thumbnails', label: 'Thumbnails', icon: <FileImage className="w-5 h-5" />, description: 'Preview images' },
  { id: 'blog', label: 'Blog & Articles', icon: <BookOpen className="w-5 h-5" />, description: 'Article images' },
  { id: 'testimonials', label: 'Testimonials', icon: <MessageSquareQuote className="w-5 h-5" />, description: 'Customer photos' },
  { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, description: 'Staff photos' },
  { id: 'icons', label: 'Icons & Logos', icon: <Sparkles className="w-5 h-5" />, description: 'Branding assets' },
];

export default function MediaLibrary() {
  const toast = useToast();
  const confirm = useConfirm();
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({
    alt_text_en: '',
    alt_text_ro: '',
    folder: '',
  });
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllMedia(data || []);

      const existingFolders = (data || [])
        .map((item: any) => item?.folder)
        .filter((f: any): f is string => typeof f === 'string');
      const defaultIds = USAGE_LOCATIONS.map(l => l.id.toLowerCase());
      const custom = existingFolders.filter((f: string) => f && !defaultIds.includes(f.toLowerCase()));
      setCustomLocations([...new Set(custom)] as string[]);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const media = (allMedia || []).filter(item => {
    if (!item) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (selectedLocation === 'uncategorized') return !item.folder;
    if (selectedLocation) return item.folder?.toLowerCase() === selectedLocation.toLowerCase();
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

        let type = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        const { error: insertError } = await supabase.from('media_library').insert({
          filename: file.name,
          url: urlData.publicUrl,
          type,
          size_bytes: file.size,
          folder: selectedLocation && selectedLocation !== 'uncategorized' ? selectedLocation : null,
        });

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw new Error(`Database insert failed: ${insertError.message}`);
        }
      }
      fetchMedia();
    } catch (error) {
      console.error('Error uploading files:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (item: MediaItem) => {
    const confirmed = await confirm({ title: 'Delete Media', message: `Delete "${item.filename}"? This cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('media_library').delete().eq('id', item.id);
      if (error) throw error;
      setAllMedia(allMedia.filter((m) => m.id !== item.id));
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media. Please try again.');
    }
  };

  const handleEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditForm({
      alt_text_en: item.alt_text_en || '',
      alt_text_ro: item.alt_text_ro || '',
      folder: item.folder || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('media_library')
        .update({
          alt_text_en: editForm.alt_text_en,
          alt_text_ro: editForm.alt_text_ro,
          folder: editForm.folder || null,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setAllMedia(
        allMedia.map((m) =>
          m.id === editingItem.id ? { ...m, ...editForm, folder: editForm.folder || null } : m
        )
      );
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update media. Please try again.');
    }
  };

  const handleAddLocation = () => {
    const name = newLocationName.trim();
    if (name && !customLocations.includes(name) && !USAGE_LOCATIONS.find(l => l.id === name.toLowerCase())) {
      setCustomLocations([...customLocations, name]);
      setSelectedLocation(name);
      setNewLocationName('');
      setShowAddLocation(false);
    }
  };

  const getLocationCount = (locationId: string | null) => {
    if (!locationId) {
      return (allMedia || []).filter(m => !m?.folder).length;
    }
    return (allMedia || []).filter(m => m?.folder?.toLowerCase() === locationId.toLowerCase()).length;
  };

  const allLocations = [
    ...USAGE_LOCATIONS,
    ...customLocations.map(name => ({
      id: name,
      label: name,
      icon: <FolderOpen className="w-5 h-5" />,
      description: 'Custom location',
    })),
  ];

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <FileVideo className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const filteredMedia = (media || []).filter(
    (item) =>
      item?.filename?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      item?.alt_text_en?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      item?.alt_text_ro?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
          <h2 className="font-semibold text-gray-900 mb-3">Usage Locations</h2>
          <p className="text-xs text-gray-500 mb-4">Select where uploaded images will be used</p>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedLocation(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedLocation === null
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Images className="w-5 h-5" />
              <span className="flex-1 font-medium">All Media</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedLocation === null ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {media.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedLocation('uncategorized')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedLocation === 'uncategorized'
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="flex-1 font-medium">Uncategorized</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedLocation === 'uncategorized' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {getLocationCount(null)}
              </span>
            </button>

            <div className="border-t border-gray-100 my-3" />

            {USAGE_LOCATIONS.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selectedLocation === location.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={location.description}
              >
                {location.icon}
                <span className="flex-1 font-medium">{location.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedLocation === location.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {getLocationCount(location.id)}
                </span>
              </button>
            ))}

            {customLocations.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-3" />
                <p className="text-xs text-gray-400 px-3 mb-1">Custom</p>
                {customLocations.map((name) => (
                  <button
                    key={name}
                    onClick={() => setSelectedLocation(name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedLocation === name
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <FolderOpen className="w-5 h-5" />
                    <span className="flex-1 font-medium">{name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedLocation === name ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {getLocationCount(name)}
                    </span>
                  </button>
                ))}
              </>
            )}

            <div className="border-t border-gray-100 my-3" />

            {showAddLocation ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Location name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddLocation}
                    className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLocation(false);
                      setNewLocationName('');
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLocation(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Custom Location</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLocation === null
                ? 'All Media'
                : selectedLocation === 'uncategorized'
                ? 'Uncategorized'
                : allLocations.find(l => l.id === selectedLocation)?.label || selectedLocation}
            </h1>
            <p className="text-gray-600 mt-1">
              {selectedLocation === null
                ? 'All images and files in your library'
                : selectedLocation === 'uncategorized'
                ? 'Files not assigned to any location'
                : allLocations.find(l => l.id === selectedLocation)?.description || 'Custom location'}
            </p>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>{uploading ? 'Uploading...' : `Upload to ${selectedLocation && selectedLocation !== 'uncategorized' ? allLocations.find(l => l.id === selectedLocation)?.label || selectedLocation : 'Library'}`}</span>
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search media..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-500 mb-6">Upload files to get started</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>Upload Files</span>
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"
            >
              <div className="relative aspect-square bg-gray-100">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.alt_text_en || item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getTypeIcon(item.type)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{formatFileSize(item.size_bytes)}</p>
                  {item.folder && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {item.folder}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Filename
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Uploaded
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMedia.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.alt_text_en || item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.filename}</p>
                    {item.alt_text_en && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {item.alt_text_en}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                      {getTypeIcon(item.type)}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatFileSize(item.size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={item.url}
                        download={item.filename}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Edit Media Details</h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {editingItem.type === 'image' ? (
                    <img
                      src={editingItem.url}
                      alt={editingItem.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getTypeIcon(editingItem.type)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{editingItem.filename}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(editingItem.size_bytes)}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (English)
                </label>
                <input
                  type="text"
                  value={editForm.alt_text_en}
                  onChange={(e) =>
                    setEditForm({ ...editForm, alt_text_en: e.target.value })
                  }
                  placeholder="Describe the image for accessibility"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (Romanian)
                </label>
                <input
                  type="text"
                  value={editForm.alt_text_ro}
                  onChange={(e) =>
                    setEditForm({ ...editForm, alt_text_ro: e.target.value })
                  }
                  placeholder="Descrierea imaginii pentru accesibilitate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Location
                </label>
                <select
                  value={editForm.folder}
                  onChange={(e) =>
                    setEditForm({ ...editForm, folder: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Uncategorized</option>
                  {allLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {previewItem.type === 'image' ? (
            <img
              src={previewItem.url}
              alt={previewItem.alt_text_en || previewItem.filename}
              className="max-w-full max-h-full object-contain"
            />
          ) : previewItem.type === 'video' ? (
            <video
              src={previewItem.url}
              controls
              className="max-w-full max-h-full"
            />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center">
              {getTypeIcon(previewItem.type)}
              <p className="mt-4 font-medium">{previewItem.filename}</p>
              <a
                href={previewItem.url}
                download={previewItem.filename}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
