import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Eye,
  EyeOff,
  Star,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import ImageSelector from '../../components/admin/ImageSelector';
import RichTextEditor from '../../components/admin/RichTextEditor';
import AIGenerateButton from '../../components/admin/AIGenerateButton';
import { useAIGenerate } from '../../hooks/useAIGenerate';

interface Article {
  id: string;
  title_ro: string;
  title_en: string;
  excerpt_ro: string;
  excerpt_en: string;
  content_ro: string;
  content_en: string;
  category: string;
  featured_image_id: string | null;
  read_time_ro: string;
  read_time_en: string;
  published_at: string;
  is_featured: boolean;
  is_visible: boolean;
  tags: string[];
  display_order: number;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
}

const CATEGORIES = ['Evenimente', 'Birouri', 'Exterior', 'Locuire', 'Amenajari', 'Studii de Caz'];

export default function ArticlesManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const { generate, generating } = useAIGenerate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [mediaCache, setMediaCache] = useState<Record<string, MediaItem>>({});
  const [filter, setFilter] = useState<'all' | 'featured' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ro' | 'en'>('ro');
  const [newArticle, setNewArticle] = useState({
    id: '',
    title_ro: '',
    title_en: '',
    excerpt_ro: '',
    excerpt_en: '',
    content_ro: '',
    content_en: '',
    category: 'Evenimente',
    featured_image_id: null as string | null,
    read_time_ro: '5 min',
    read_time_en: '5 min',
    published_at: new Date().toISOString().split('T')[0],
    is_featured: false,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setArticles(data || []);

      const imageIds = data?.filter((a: Article) => a.featured_image_id).map((a: Article) => a.featured_image_id as string) || [];
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
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleAddArticle = async () => {
    if (!newArticle.id.trim() || !newArticle.title_ro.trim() || !newArticle.title_en.trim()) {
      toast.warning('Please fill in the ID and titles in both languages');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...newArticle,
          display_order: articles.length,
        })
        .select()
        .single();

      if (error) throw error;

      setArticles([...articles, data]);
      setShowAddModal(false);
      setNewArticle({
        id: '',
        title_ro: '',
        title_en: '',
        excerpt_ro: '',
        excerpt_en: '',
        content_ro: '',
        content_en: '',
        category: 'Evenimente',
        featured_image_id: null,
        read_time_ro: '5 min',
        read_time_en: '5 min',
        published_at: new Date().toISOString().split('T')[0],
        is_featured: false,
        tags: [],
      });
      setTagInput('');
    } catch (error) {
      console.error('Error adding article:', error);
      toast.error('Failed to add article. Please try again.');
    }
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title_ro: editingArticle.title_ro,
          title_en: editingArticle.title_en,
          excerpt_ro: editingArticle.excerpt_ro,
          excerpt_en: editingArticle.excerpt_en,
          content_ro: editingArticle.content_ro,
          content_en: editingArticle.content_en,
          category: editingArticle.category,
          featured_image_id: editingArticle.featured_image_id,
          read_time_ro: editingArticle.read_time_ro,
          read_time_en: editingArticle.read_time_en,
          published_at: editingArticle.published_at,
          is_featured: editingArticle.is_featured,
          is_visible: editingArticle.is_visible,
          tags: editingArticle.tags,
        })
        .eq('id', editingArticle.id);

      if (error) throw error;

      setArticles(
        articles.map((a) => (a.id === editingArticle.id ? editingArticle : a))
      );
      setEditingArticle(null);
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Article',
      message: 'Are you sure you want to delete this article?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('articles').delete().eq('id', id);

      if (error) throw error;
      setArticles(articles.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article. Please try again.');
    }
  };

  const handleToggleVisibility = async (article: Article) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ is_visible: !article.is_visible })
        .eq('id', article.id);

      if (error) throw error;

      setArticles(
        articles.map((a) =>
          a.id === article.id ? { ...a, is_visible: !a.is_visible } : a
        )
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleToggleFeatured = async (article: Article) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ is_featured: !article.is_featured })
        .eq('id', article.id);

      if (error) throw error;

      setArticles(
        articles.map((a) =>
          a.id === article.id ? { ...a, is_featured: !a.is_featured } : a
        )
      );
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const handleImageSelect = (items: { id: string; url: string }[]) => {
    if (items.length === 0) return;
    const { id: imageId, url: imageUrl } = items[0];

    if (editingArticle) {
      setEditingArticle({ ...editingArticle, featured_image_id: imageId });
      setMediaCache({ ...mediaCache, [imageId]: { id: imageId, url: imageUrl, filename: '' } });
    } else {
      setNewArticle({ ...newArticle, featured_image_id: imageId });
      setMediaCache({ ...mediaCache, [imageId]: { id: imageId, url: imageUrl, filename: '' } });
    }
    setShowImageSelector(false);
  };

  const addTag = (tag: string, isEditing: boolean) => {
    if (!tag.trim()) return;
    const trimmedTag = tag.trim();

    if (isEditing && editingArticle) {
      if (!editingArticle.tags.includes(trimmedTag)) {
        setEditingArticle({
          ...editingArticle,
          tags: [...editingArticle.tags, trimmedTag],
        });
      }
    } else {
      if (!newArticle.tags.includes(trimmedTag)) {
        setNewArticle({
          ...newArticle,
          tags: [...newArticle.tags, trimmedTag],
        });
      }
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string, isEditing: boolean) => {
    if (isEditing && editingArticle) {
      setEditingArticle({
        ...editingArticle,
        tags: editingArticle.tags.filter((t) => t !== tagToRemove),
      });
    } else {
      setNewArticle({
        ...newArticle,
        tags: newArticle.tags.filter((t) => t !== tagToRemove),
      });
    }
  };

  const aiGenerateField = async (
    id: string,
    type: 'article_title' | 'article_excerpt' | 'article_content',
    lang: 'en' | 'ro',
    isEditing: boolean
  ) => {
    const article = isEditing ? editingArticle : newArticle;
    const context = isEditing
      ? (lang === 'en' ? editingArticle?.title_en : editingArticle?.title_ro) ||
        (lang === 'en' ? editingArticle?.title_ro : editingArticle?.title_en)
      : (lang === 'en' ? newArticle.title_en : newArticle.title_ro) ||
        (lang === 'en' ? newArticle.title_ro : newArticle.title_en);

    const result = await generate(id, {
      type,
      language: lang,
      category: article?.category,
      context: context || undefined,
    });

    if (!result) {
      toast.error('AI generation failed. Please try again.');
      return;
    }

    const fieldMap: Record<string, string> = {
      article_title: `title_${lang}`,
      article_excerpt: `excerpt_${lang}`,
      article_content: `content_${lang}`,
    };
    const field = fieldMap[type];

    if (isEditing && editingArticle) {
      setEditingArticle({ ...editingArticle, [field]: result });
    } else {
      setNewArticle({ ...newArticle, [field]: result });
    }
  };

  const aiTranslateField = async (
    id: string,
    field: 'title' | 'excerpt' | 'content',
    targetLang: 'en' | 'ro',
    isEditing: boolean
  ) => {
    const sourceLang = targetLang === 'en' ? 'ro' : 'en';
    const sourceKey = `${field}_${sourceLang}` as keyof typeof newArticle;
    const sourceValue = isEditing
      ? (editingArticle as unknown as Record<string, string | boolean | string[]>)?.[`${field}_${sourceLang}`] as string
      : (newArticle as unknown as Record<string, string | boolean | string[]>)[`${field}_${sourceLang}`] as string;

    if (!sourceValue?.trim()) {
      toast.warning(`No ${sourceLang.toUpperCase()} content to translate from.`);
      return;
    }

    const result = await generate(id, {
      type: 'translate',
      language: targetLang,
      existingContent: sourceValue,
    });

    if (!result) {
      toast.error('Translation failed. Please try again.');
      return;
    }

    const targetKey = `${field}_${targetLang}`;
    if (isEditing && editingArticle) {
      setEditingArticle({ ...editingArticle, [targetKey]: result });
    } else {
      setNewArticle({ ...newArticle, [targetKey]: result });
    }

    void sourceKey;
  };

  const filteredArticles = articles.filter((article) => {
    if (filter === 'featured' && !article.is_featured) return false;
    if (filter === 'hidden' && article.is_visible) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        article.title_ro.toLowerCase().includes(query) ||
        article.title_en.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles Management</h1>
          <p className="text-gray-600 mt-2">Manage inspiration articles and content</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Article
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'featured'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Featured
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'hidden'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hidden
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-48 bg-gray-100">
              {article.featured_image_id && mediaCache[article.featured_image_id] ? (
                <img
                  src={mediaCache[article.featured_image_id].url}
                  alt={article.title_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                {article.is_featured && (
                  <span className="bg-yellow-500 text-white p-1.5 rounded-full">
                    <Star className="w-4 h-4" />
                  </span>
                )}
                {!article.is_visible && (
                  <span className="bg-gray-500 text-white p-1.5 rounded-full">
                    <EyeOff className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.read_time_en}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {article.title_en}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {article.excerpt_en}
              </p>

              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleVisibility(article)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={article.is_visible ? 'Hide' : 'Show'}
                  >
                    {article.is_visible ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(article)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={article.is_featured ? 'Unfeature' : 'Feature'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        article.is_featured ? 'text-yellow-500 fill-current' : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingArticle(article)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first article'}
          </p>
        </div>
      )}

      {(showAddModal || editingArticle) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingArticle ? 'Edit Article' : 'Add New Article'}
              </h2>
              <button
                onClick={() => {
                  setEditingArticle(null);
                  setShowAddModal(false);
                  setTagInput('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab('ro')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'ro'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Romanian
                </button>
                <button
                  onClick={() => setActiveTab('en')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'en'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  English
                </button>
              </div>

              {!editingArticle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article ID (URL slug)
                  </label>
                  <input
                    type="text"
                    value={newArticle.id}
                    onChange={(e) => setNewArticle({ ...newArticle, id: e.target.value })}
                    placeholder="e.g., top-5-petreceri-curte"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              )}

              {activeTab === 'ro' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Title (Romanian)</label>
                      <div className="flex gap-1">
                        <AIGenerateButton
                          id="title-ro"
                          generating={generating}
                          onClick={() => aiGenerateField('title-ro', 'article_title', 'ro', !!editingArticle)}
                        />
                        <AIGenerateButton
                          id="title-ro-tr"
                          generating={generating}
                          onClick={() => aiTranslateField('title-ro-tr', 'title', 'en', !!editingArticle)}
                          variant="translate"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingArticle ? editingArticle.title_ro : newArticle.title_ro}
                      onChange={(e) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, title_ro: e.target.value })
                          : setNewArticle({ ...newArticle, title_ro: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Excerpt (Romanian)</label>
                      <div className="flex gap-1">
                        <AIGenerateButton
                          id="excerpt-ro"
                          generating={generating}
                          onClick={() => aiGenerateField('excerpt-ro', 'article_excerpt', 'ro', !!editingArticle)}
                        />
                        <AIGenerateButton
                          id="excerpt-ro-tr"
                          generating={generating}
                          onClick={() => aiTranslateField('excerpt-ro-tr', 'excerpt', 'en', !!editingArticle)}
                          variant="translate"
                        />
                      </div>
                    </div>
                    <textarea
                      value={editingArticle ? editingArticle.excerpt_ro : newArticle.excerpt_ro}
                      onChange={(e) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, excerpt_ro: e.target.value })
                          : setNewArticle({ ...newArticle, excerpt_ro: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Content (Romanian)</label>
                      <div className="flex gap-1">
                        <AIGenerateButton
                          id="content-ro"
                          generating={generating}
                          onClick={() => aiGenerateField('content-ro', 'article_content', 'ro', !!editingArticle)}
                          label="Generate full article"
                          size="md"
                        />
                        <AIGenerateButton
                          id="content-ro-tr"
                          generating={generating}
                          onClick={() => aiTranslateField('content-ro-tr', 'content', 'en', !!editingArticle)}
                          variant="translate"
                          size="md"
                        />
                      </div>
                    </div>
                    <RichTextEditor
                      value={editingArticle ? editingArticle.content_ro : newArticle.content_ro}
                      onChange={(value) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, content_ro: value })
                          : setNewArticle({ ...newArticle, content_ro: value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Read Time (Romanian)
                    </label>
                    <input
                      type="text"
                      value={editingArticle ? editingArticle.read_time_ro : newArticle.read_time_ro}
                      onChange={(e) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, read_time_ro: e.target.value })
                          : setNewArticle({ ...newArticle, read_time_ro: e.target.value })
                      }
                      placeholder="e.g., 5 min"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Title (English)</label>
                      <div className="flex gap-1">
                        <AIGenerateButton
                          id="title-en"
                          generating={generating}
                          onClick={() => aiGenerateField('title-en', 'article_title', 'en', !!editingArticle)}
                        />
                        <AIGenerateButton
                          id="title-en-tr"
                          generating={generating}
                          onClick={() => aiTranslateField('title-en-tr', 'title', 'ro', !!editingArticle)}
                          variant="translate"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingArticle ? editingArticle.title_en : newArticle.title_en}
                      onChange={(e) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, title_en: e.target.value })
                          : setNewArticle({ ...newArticle, title_en: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Excerpt (English)</label>
                      <div className="flex gap-1">
                        <AIGenerateButton
                          id="excerpt-en"
                          generating={generating}
                          onClick={() => aiGenerateField('excerpt-en', 'article_excerpt', 'en', !!editingArticle)}
                        />
                        <AIGenerateButton
                          id="excerpt-en-tr"
                          generating={generating}
                          onClick={() => aiTranslateField('excerpt-en-tr', 'excerpt', 'ro', !!editingArticle)}
                          variant="translate"
                        />
                      </div>
                    </div>
                    <textarea
                      value={editingArticle ? editingArticle.excerpt_en : newArticle.excerpt_en}
                      onChange={(e) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, excerpt_en: e.target.value })
                          : setNewArticle({ ...newArticle, excerpt_en: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Content (English)</label>
                      <div className="flex gap-1">
                        <AIGenerateButton
                          id="content-en"
                          generating={generating}
                          onClick={() => aiGenerateField('content-en', 'article_content', 'en', !!editingArticle)}
                          label="Generate full article"
                          size="md"
                        />
                        <AIGenerateButton
                          id="content-en-tr"
                          generating={generating}
                          onClick={() => aiTranslateField('content-en-tr', 'content', 'ro', !!editingArticle)}
                          variant="translate"
                          size="md"
                        />
                      </div>
                    </div>
                    <RichTextEditor
                      value={editingArticle ? editingArticle.content_en : newArticle.content_en}
                      onChange={(value) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, content_en: value })
                          : setNewArticle({ ...newArticle, content_en: value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Read Time (English)
                    </label>
                    <input
                      type="text"
                      value={editingArticle ? editingArticle.read_time_en : newArticle.read_time_en}
                      onChange={(e) =>
                        editingArticle
                          ? setEditingArticle({ ...editingArticle, read_time_en: e.target.value })
                          : setNewArticle({ ...newArticle, read_time_en: e.target.value })
                      }
                      placeholder="e.g., 5 min"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editingArticle ? editingArticle.category : newArticle.category}
                    onChange={(e) =>
                      editingArticle
                        ? setEditingArticle({ ...editingArticle, category: e.target.value })
                        : setNewArticle({ ...newArticle, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Published Date
                  </label>
                  <input
                    type="date"
                    value={editingArticle ? editingArticle.published_at : newArticle.published_at}
                    onChange={(e) =>
                      editingArticle
                        ? setEditingArticle({ ...editingArticle, published_at: e.target.value })
                        : setNewArticle({ ...newArticle, published_at: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <div className="flex items-center gap-4">
                  {(editingArticle?.featured_image_id || newArticle.featured_image_id) &&
                  mediaCache[
                    editingArticle?.featured_image_id || newArticle.featured_image_id || ''
                  ] ? (
                    <img
                      src={
                        mediaCache[
                          editingArticle?.featured_image_id || newArticle.featured_image_id || ''
                        ].url
                      }
                      alt="Featured"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => setShowImageSelector(true)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Select Image
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput, !!editingArticle);
                      }
                    }}
                    placeholder="Add a tag"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => addTag(tagInput, !!editingArticle)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingArticle ? editingArticle.tags : newArticle.tags).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag, !!editingArticle)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {editingArticle && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingArticle.is_featured}
                      onChange={(e) =>
                        setEditingArticle({ ...editingArticle, is_featured: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Featured Article</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingArticle.is_visible}
                      onChange={(e) =>
                        setEditingArticle({ ...editingArticle, is_visible: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Visible</span>
                  </label>
                </div>
              )}

              {!editingArticle && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newArticle.is_featured}
                    onChange={(e) =>
                      setNewArticle({ ...newArticle, is_featured: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Featured Article</span>
                </label>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setEditingArticle(null);
                  setShowAddModal(false);
                  setTagInput('');
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingArticle ? handleSaveArticle : handleAddArticle}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : editingArticle ? 'Save Changes' : 'Add Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageSelector && (
        <ImageSelector
          value={editingArticle?.featured_image_id ?? newArticle.featured_image_id}
          onChange={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}
