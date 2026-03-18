import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Layout,
  Home,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import ImageSelector from '../../components/admin/ImageSelector';
import SectionEditModal from './content/SectionEditModal';
import BlockEditModal from './content/BlockEditModal';

interface PageSection {
  id: string;
  page: string;
  section: string;
  title_en: string | null;
  title_ro: string | null;
  subtitle_en: string | null;
  subtitle_ro: string | null;
  content_en: string | null;
  content_ro: string | null;
  image_id: string | null;
  settings: Record<string, unknown>;
  is_visible: boolean;
  display_order: number;
}

interface ContentBlock {
  id: string;
  section_id: string;
  type: string;
  icon: string | null;
  title_en: string | null;
  title_ro: string | null;
  description_en: string | null;
  description_ro: string | null;
  link_url: string | null;
  image_id: string | null;
  settings: Record<string, unknown>;
  display_order: number;
  is_visible: boolean;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
}

const PAGE_OPTIONS = [
  { value: 'home', label: 'Homepage', icon: <Home className="w-4 h-4" /> },
];

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'features', label: 'Key Features' },
  { value: 'gallery', label: 'Photo Gallery' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'pricing', label: 'Pricing/Rental Options' },
  { value: 'location', label: 'Location' },
  { value: 'contact', label: 'Contact Form' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'faq', label: 'FAQ' },
  { value: 'custom', label: 'Custom Section' },
];

export default function ContentEditor() {
  const toast = useToast();
  const confirm = useConfirm();
  const [sections, setSections] = useState<PageSection[]>([]);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState('home');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageSelectTarget, setImageSelectTarget] = useState<'section' | 'block'>('section');
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [newSectionType, setNewSectionType] = useState('custom');
  const [mediaCache, setMediaCache] = useState<Record<string, MediaItem>>({});

  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page', selectedPage)
        .order('display_order');

      if (error) throw error;
      setSections(data || []);

      const imageIds = data?.filter((s: PageSection) => s.image_id).map((s: PageSection) => s.image_id as string) || [];
      if (imageIds.length > 0) {
        const { data: mediaData } = await supabase
          .from('media_library')
          .select('id, url, filename')
          .in('id', imageIds);
        if (mediaData) {
          const cache: Record<string, MediaItem> = { ...mediaCache };
          mediaData.forEach((m: MediaItem) => {
            cache[m.id] = m;
          });
          setMediaCache(cache);
        }
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPage, setSections, setLoading, setMediaCache, mediaCache]);

  const fetchBlocks = useCallback(async () => {
    try {
      const { data: sectionsData } = await supabase.from('page_sections').select('id').eq('page', selectedPage);
      if (!sectionsData || sectionsData.length === 0) { setBlocks([]); return; }

      const sectionIds = sectionsData.map((s: { id: string }) => s.id);
      const { data, error } = await supabase.from('content_blocks').select('*').in('section_id', sectionIds).order('display_order');
      if (error) throw error;
      setBlocks(data || []);

      const imageIds = data?.filter((b: ContentBlock) => b.image_id).map((b: ContentBlock) => b.image_id as string) || [];
      if (imageIds.length > 0) {
        const { data: mediaData } = await supabase
          .from('media_library')
          .select('id, url, filename')
          .in('id', imageIds);
        if (mediaData) {
          const cache: Record<string, MediaItem> = { ...mediaCache };
          mediaData.forEach((m: MediaItem) => {
            cache[m.id] = m;
          });
          setMediaCache(cache);
        }
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  }, [selectedPage, setBlocks, setMediaCache, mediaCache]);

  useEffect(() => {
    fetchSections();
    fetchBlocks();
  }, [selectedPage, fetchSections, fetchBlocks]);

  const handleCreateSection = async () => {
    try {
      const { data, error } = await supabase
        .from('page_sections')
        .insert({
          page: selectedPage,
          section: newSectionType,
          title_en: `New ${SECTION_TYPES.find((t) => t.value === newSectionType)?.label || 'Section'}`,
          title_ro: `${SECTION_TYPES.find((t) => t.value === newSectionType)?.label || 'Sectiune'} Noua`,
          display_order: sections.length,
        })
        .select()
        .single();

      if (error) throw error;
      setSections([...sections, data]);
      setShowNewSectionModal(false);
      setExpandedSections([...expandedSections, data.id]);
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section. Please try again.');
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({
          title_en: editingSection.title_en,
          title_ro: editingSection.title_ro,
          subtitle_en: editingSection.subtitle_en,
          subtitle_ro: editingSection.subtitle_ro,
          content_en: editingSection.content_en,
          content_ro: editingSection.content_ro,
          image_id: editingSection.image_id,
          settings: editingSection.settings,
          is_visible: editingSection.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSection.id);

      if (error) throw error;
      setSections(sections.map((s) => (s.id === editingSection.id ? editingSection : s)));
      setEditingSection(null);
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (section: PageSection) => {
    const confirmed = await confirm({
      title: 'Delete Section',
      message: `Delete "${section.title_en || section.section}" section? This will also delete all content blocks within it.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('page_sections').delete().eq('id', section.id);
      if (error) throw error;
      setSections(sections.filter((s) => s.id !== section.id));
      setBlocks(blocks.filter((b) => b.section_id !== section.id));
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section. Please try again.');
    }
  };

  const toggleSectionVisibility = async (section: PageSection) => {
    try {
      const { error } = await supabase.from('page_sections').update({ is_visible: !section.is_visible }).eq('id', section.id);
      if (error) throw error;
      setSections(sections.map((s) => (s.id === section.id ? { ...s, is_visible: !s.is_visible } : s)));
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleCreateBlock = async (sectionId: string) => {
    try {
      const sectionBlocks = blocks.filter((b) => b.section_id === sectionId);
      const { data, error } = await supabase
        .from('content_blocks')
        .insert({ section_id: sectionId, type: 'feature', title_en: 'New Item', title_ro: 'Element Nou', display_order: sectionBlocks.length })
        .select()
        .single();
      if (error) throw error;
      setBlocks([...blocks, data]);
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Failed to create content block. Please try again.');
    }
  };

  const handleSaveBlock = async () => {
    if (!editingBlock) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_blocks')
        .update({
          type: editingBlock.type,
          icon: editingBlock.icon,
          title_en: editingBlock.title_en,
          title_ro: editingBlock.title_ro,
          description_en: editingBlock.description_en,
          description_ro: editingBlock.description_ro,
          link_url: editingBlock.link_url,
          image_id: editingBlock.image_id,
          settings: editingBlock.settings,
          is_visible: editingBlock.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBlock.id);
      if (error) throw error;
      setBlocks(blocks.map((b) => (b.id === editingBlock.id ? editingBlock : b)));
      setEditingBlock(null);
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save content block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (block: ContentBlock) => {
    const confirmed = await confirm({
      title: 'Delete Block',
      message: `Delete "${block.title_en || 'this item'}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('content_blocks').delete().eq('id', block.id);
      if (error) throw error;
      setBlocks(blocks.filter((b) => b.id !== block.id));
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete content block. Please try again.');
    }
  };

  const toggleBlockVisibility = async (block: ContentBlock) => {
    try {
      const { error } = await supabase.from('content_blocks').update({ is_visible: !block.is_visible }).eq('id', block.id);
      if (error) throw error;
      setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, is_visible: !b.is_visible } : b)));
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleImageSelect = (items: { id: string; url: string }[]) => {
    if (items.length === 0) {
      if (imageSelectTarget === 'section' && editingSection) {
        setEditingSection({ ...editingSection, image_id: null });
      } else if (imageSelectTarget === 'block' && editingBlock) {
        setEditingBlock({ ...editingBlock, image_id: null });
      }
      setShowImageSelector(false);
      return;
    }

    const { id: imageId, url } = items[0];

    if (imageSelectTarget === 'section' && editingSection) {
      setEditingSection({ ...editingSection, image_id: imageId });
    } else if (imageSelectTarget === 'block' && editingBlock) {
      setEditingBlock({ ...editingBlock, image_id: imageId });
    }
    
    setMediaCache((prev) => ({ ...prev, [imageId]: { id: imageId, url, filename: '' } }));
    setShowImageSelector(false);
  };

  const getSectionBlocks = (sectionId: string) =>
    blocks.filter((b) => b.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);

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
          <h1 className="text-2xl font-bold text-gray-900">Content Editor</h1>
          <p className="text-gray-600 mt-1">Manage page sections and content blocks</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {PAGE_OPTIONS.map((page) => (
              <option key={page.value} value={page.value}>{page.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNewSectionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Section
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Layout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
          <p className="text-gray-500 mb-6">Add your first section to get started</p>
          <button
            onClick={() => setShowNewSectionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSections((prev) =>
                  prev.includes(section.id) ? prev.filter((id) => id !== section.id) : [...prev, section.id]
                )}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  {expandedSections.includes(section.id) ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                  <div>
                    <h3 className="font-medium text-gray-900">{section.title_en || section.section}</h3>
                    <p className="text-sm text-gray-500 capitalize">{section.section}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleSectionVisibility(section)}
                    className={`p-2 rounded-lg transition-colors ${section.is_visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    {section.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setEditingSection(section)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeleteSection(section)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {expandedSections.includes(section.id) && (
                <div className="border-t p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700">Content Blocks</h4>
                    <button
                      onClick={() => handleCreateBlock(section.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Block
                    </button>
                  </div>
                  {getSectionBlocks(section.id).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No content blocks in this section</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getSectionBlocks(section.id).map((block) => (
                        <div key={block.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{block.title_en || 'Untitled'}</p>
                              <p className="text-xs text-gray-500 capitalize">{block.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleBlockVisibility(block)}
                              className={`p-1.5 rounded transition-colors ${block.is_visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                              {block.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditingBlock(block)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteBlock(block)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Add New Section</h2>
              <button onClick={() => setShowNewSectionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Type</label>
              <select
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {SECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => setShowNewSectionModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleCreateSection} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Create Section</button>
            </div>
          </div>
        </div>
      )}

      {editingSection && (
        <SectionEditModal
          section={editingSection}
          saving={saving}
          mediaCache={mediaCache}
          onChange={setEditingSection}
          onSave={handleSaveSection}
          onClose={() => setEditingSection(null)}
          onSelectImage={() => { setImageSelectTarget('section'); setShowImageSelector(true); }}
        />
      )}

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          saving={saving}
          mediaCache={mediaCache}
          onChange={setEditingBlock}
          onSave={handleSaveBlock}
          onClose={() => setEditingBlock(null)}
          onSelectImage={() => { setImageSelectTarget('block'); setShowImageSelector(true); }}
        />
      )}

      {showImageSelector && (
        <ImageSelector
          value={imageSelectTarget === 'section' ? editingSection?.image_id || null : editingBlock?.image_id || null}
          onChange={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}
