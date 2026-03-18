import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Star,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Quote,
  Award,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import ImageSelector from '../../components/admin/ImageSelector';

interface Testimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  author_image_id: string | null;
  content_en: string;
  content_ro: string;
  rating: number;
  source: string | null;
  date: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
}

export default function TestimonialsManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [mediaCache, setMediaCache] = useState<Record<string, MediaItem>>({});
  const [filter, setFilter] = useState<'all' | 'featured' | 'hidden'>('all');
  const [newTestimonial, setNewTestimonial] = useState({
    author_name: '',
    author_title: '',
    author_image_id: null as string | null,
    content_en: '',
    content_ro: '',
    rating: 5,
    source: '',
    date: new Date().toISOString().split('T')[0],
    is_featured: false,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTestimonials(data || []);

      const imageIds = data?.filter((t: Testimonial) => t.author_image_id).map((t: Testimonial) => t.author_image_id as string) || [];
      if (imageIds.length > 0) {
        const { data: mediaData } = await supabase
          .from('media_library')
          .select('id, url, filename')
          .in('id', imageIds);

        if (mediaData) {
          const cache: Record<string, MediaItem> = {};
          mediaData.forEach((m: MediaItem) => {
            cache[m.id] = m;
          });
          setMediaCache(cache);
        }
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.author_name.trim() || !newTestimonial.content_en.trim()) {
      toast.warning('Please fill in the author name and content');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          ...newTestimonial,
          display_order: testimonials.length,
        })
        .select()
        .single();

      if (error) throw error;

      setTestimonials([...testimonials, data]);
      setShowAddModal(false);
      setNewTestimonial({
        author_name: '',
        author_title: '',
        author_image_id: null,
        content_en: '',
        content_ro: '',
        rating: 5,
        source: '',
        date: new Date().toISOString().split('T')[0],
        is_featured: false,
      });
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error('Failed to add testimonial. Please try again.');
    }
  };

  const handleSaveTestimonial = async () => {
    if (!editingTestimonial) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({
          author_name: editingTestimonial.author_name,
          author_title: editingTestimonial.author_title,
          author_image_id: editingTestimonial.author_image_id,
          content_en: editingTestimonial.content_en,
          content_ro: editingTestimonial.content_ro,
          rating: editingTestimonial.rating,
          source: editingTestimonial.source,
          date: editingTestimonial.date,
          is_featured: editingTestimonial.is_featured,
          is_visible: editingTestimonial.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTestimonial.id);

      if (error) throw error;

      setTestimonials(
        testimonials.map((t) => (t.id === editingTestimonial.id ? editingTestimonial : t))
      );
      setEditingTestimonial(null);
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('Failed to save testimonial. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (testimonial: Testimonial) => {
    const confirmed = await confirm({
      title: 'Delete Testimonial',
      message: `Delete testimonial from "${testimonial.author_name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonial.id);

      if (error) throw error;
      setTestimonials(testimonials.filter((t) => t.id !== testimonial.id));
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial. Please try again.');
    }
  };

  const toggleVisibility = async (testimonial: Testimonial) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_visible: !testimonial.is_visible })
        .eq('id', testimonial.id);

      if (error) throw error;
      setTestimonials(
        testimonials.map((t) =>
          t.id === testimonial.id ? { ...t, is_visible: !t.is_visible } : t
        )
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const toggleFeatured = async (testimonial: Testimonial) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_featured: !testimonial.is_featured })
        .eq('id', testimonial.id);

      if (error) throw error;
      setTestimonials(
        testimonials.map((t) =>
          t.id === testimonial.id ? { ...t, is_featured: !t.is_featured } : t
        )
      );
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const handleImageSelect = (items: { id: string; url: string }[]) => {
    if (items.length === 0) {
      if (showAddModal) {
        setNewTestimonial({ ...newTestimonial, author_image_id: null });
      } else if (editingTestimonial) {
        setEditingTestimonial({ ...editingTestimonial, author_image_id: null });
      }
      setShowImageSelector(false);
      return;
    }

    const { id: imageId, url } = items[0];

    if (showAddModal) {
      setNewTestimonial({ ...newTestimonial, author_image_id: imageId });
    } else if (editingTestimonial) {
      setEditingTestimonial({ ...editingTestimonial, author_image_id: imageId });
    }

    setMediaCache((prev) => ({
      ...prev,
      [imageId]: { id: imageId, url, filename: '' },
    }));
    setShowImageSelector(false);
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const filteredTestimonials = testimonials.filter((t) => {
    if (filter === 'featured') return t.is_featured;
    if (filter === 'hidden') return !t.is_visible;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-gray-600 mt-1">Manage customer reviews and testimonials</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-2">
          {(['all', 'featured', 'hidden'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f} (
              {f === 'all'
                ? testimonials.length
                : f === 'featured'
                ? testimonials.filter((t) => t.is_featured).length
                : testimonials.filter((t) => !t.is_visible).length}
              )
            </button>
          ))}
        </div>
      </div>

      {filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Quote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials yet</h3>
          <p className="text-gray-500 mb-6">Add your first testimonial to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                testimonial.is_featured ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {testimonial.author_image_id && mediaCache[testimonial.author_image_id] ? (
                      <img
                        src={mediaCache[testimonial.author_image_id].url}
                        alt={testimonial.author_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {testimonial.author_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{testimonial.author_name}</h3>
                      {testimonial.author_title && (
                        <p className="text-sm text-gray-500">{testimonial.author_title}</p>
                      )}
                    </div>
                  </div>
                  {testimonial.is_featured && (
                    <Award className="w-5 h-5 text-yellow-500" />
                  )}
                </div>

                {renderStars(testimonial.rating)}

                <p className="mt-4 text-gray-600 line-clamp-4">{testimonial.content_en}</p>

                {testimonial.source && (
                  <p className="mt-3 text-xs text-gray-400">via {testimonial.source}</p>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  {new Date(testimonial.date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFeatured(testimonial)}
                    className={`p-1.5 rounded transition-colors ${
                      testimonial.is_featured
                        ? 'text-yellow-500 hover:bg-yellow-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={testimonial.is_featured ? 'Unfeature' : 'Feature'}
                  >
                    <Award className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleVisibility(testimonial)}
                    className={`p-1.5 rounded transition-colors ${
                      testimonial.is_visible
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {testimonial.is_visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTestimonial(testimonial)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(testimonial)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">Add Testimonial</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                {newTestimonial.author_image_id && mediaCache[newTestimonial.author_image_id] ? (
                  <div className="relative">
                    <img
                      src={mediaCache[newTestimonial.author_image_id].url}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <button
                      onClick={() =>
                        setNewTestimonial({ ...newTestimonial, author_image_id: null })
                      }
                      className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => setShowImageSelector(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Select Photo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Name *
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.author_name}
                    onChange={(e) =>
                      setNewTestimonial({ ...newTestimonial, author_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title/Role
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.author_title}
                    onChange={(e) =>
                      setNewTestimonial({ ...newTestimonial, author_title: e.target.value })
                    }
                    placeholder="e.g., CEO, Company Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                {renderStars(newTestimonial.rating, true, (r) =>
                  setNewTestimonial({ ...newTestimonial, rating: r })
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (English) *
                </label>
                <textarea
                  value={newTestimonial.content_en}
                  onChange={(e) =>
                    setNewTestimonial({ ...newTestimonial, content_en: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (Romanian)
                </label>
                <textarea
                  value={newTestimonial.content_ro}
                  onChange={(e) =>
                    setNewTestimonial({ ...newTestimonial, content_ro: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.source}
                    onChange={(e) =>
                      setNewTestimonial({ ...newTestimonial, source: e.target.value })
                    }
                    placeholder="e.g., Google, Booking.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newTestimonial.date}
                    onChange={(e) =>
                      setNewTestimonial({ ...newTestimonial, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTestimonial.is_featured}
                    onChange={(e) =>
                      setNewTestimonial({ ...newTestimonial, is_featured: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
                <span className="text-sm text-gray-700">Feature this testimonial</span>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTestimonial}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Add Testimonial
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">Edit Testimonial</h2>
              <button
                onClick={() => setEditingTestimonial(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                {editingTestimonial.author_image_id &&
                mediaCache[editingTestimonial.author_image_id] ? (
                  <div className="relative">
                    <img
                      src={mediaCache[editingTestimonial.author_image_id].url}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <button
                      onClick={() =>
                        setEditingTestimonial({ ...editingTestimonial, author_image_id: null })
                      }
                      className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => setShowImageSelector(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Select Photo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.author_name}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        author_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title/Role
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.author_title || ''}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        author_title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                {renderStars(editingTestimonial.rating, true, (r) =>
                  setEditingTestimonial({ ...editingTestimonial, rating: r })
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (English)
                </label>
                <textarea
                  value={editingTestimonial.content_en}
                  onChange={(e) =>
                    setEditingTestimonial({
                      ...editingTestimonial,
                      content_en: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (Romanian)
                </label>
                <textarea
                  value={editingTestimonial.content_ro}
                  onChange={(e) =>
                    setEditingTestimonial({
                      ...editingTestimonial,
                      content_ro: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.source || ''}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        source: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingTestimonial.date}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestimonial.is_featured}
                      onChange={(e) =>
                        setEditingTestimonial({
                          ...editingTestimonial,
                          is_featured: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                  <span className="text-sm text-gray-700">Featured</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestimonial.is_visible}
                      onChange={(e) =>
                        setEditingTestimonial({
                          ...editingTestimonial,
                          is_visible: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm text-gray-700">Visible</span>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTestimonial}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageSelector && (
        <ImageSelector
          value={
            showAddModal
              ? newTestimonial.author_image_id
              : editingTestimonial?.author_image_id || null
          }
          onChange={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}
