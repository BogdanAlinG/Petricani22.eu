import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  GripVertical,
  Eye,
  EyeOff,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import RichTextEditor from '../../components/admin/RichTextEditor';
import AIGenerateButton from '../../components/admin/AIGenerateButton';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { useAIGenerate } from '../../hooks/useAIGenerate';
import DOMPurify from 'dompurify';

interface FAQ {
  id: string;
  category: string;
  question_en: string;
  question_ro: string;
  answer_en: string;
  answer_ro: string;
  display_order: number;
  is_visible: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'booking', label: 'Booking & Reservations' },
  { value: 'payment', label: 'Payment' },
  { value: 'property', label: 'Property & Amenities' },
  { value: 'policies', label: 'Policies' },
];

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFaq, setNewFaq] = useState({
    category: 'general',
    question_en: '',
    question_ro: '',
    answer_en: '',
    answer_ro: '',
  });
  const toast = useToast();
  const confirm = useConfirm();
  const { generate, generating } = useAIGenerate();

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('category')
        .order('display_order');

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (faqId: string) => {
    setExpandedFaqs((prev) =>
      prev.includes(faqId) ? prev.filter((id) => id !== faqId) : [...prev, faqId]
    );
  };

  const handleAddFaq = async () => {
    if (!newFaq.question_en.trim() || !newFaq.answer_en.trim()) {
      toast.warning('Please fill in the question and answer');
      return;
    }

    try {
      const categoryFaqs = faqs.filter((f) => f.category === newFaq.category);

      const { data, error } = await supabase
        .from('faqs')
        .insert({
          ...newFaq,
          display_order: categoryFaqs.length,
        })
        .select()
        .single();

      if (error) throw error;

      setFaqs([...faqs, data]);
      setShowAddModal(false);
      setNewFaq({
        category: 'general',
        question_en: '',
        question_ro: '',
        answer_en: '',
        answer_ro: '',
      });
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast.error('Failed to add FAQ. Please try again.');
    }
  };

  const handleSaveFaq = async () => {
    if (!editingFaq) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('faqs')
        .update({
          category: editingFaq.category,
          question_en: editingFaq.question_en,
          question_ro: editingFaq.question_ro,
          answer_en: editingFaq.answer_en,
          answer_ro: editingFaq.answer_ro,
          is_visible: editingFaq.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingFaq.id);

      if (error) throw error;

      setFaqs(faqs.map((f) => (f.id === editingFaq.id ? editingFaq : f)));
      setEditingFaq(null);
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (faq: FAQ) => {
    const confirmed = await confirm({
      title: 'Delete FAQ',
      message: 'Are you sure you want to delete this FAQ?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('faqs').delete().eq('id', faq.id);
      if (error) throw error;
      setFaqs(faqs.filter((f) => f.id !== faq.id));
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ. Please try again.');
    }
  };

  const toggleVisibility = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_visible: !faq.is_visible })
        .eq('id', faq.id);

      if (error) throw error;
      setFaqs(faqs.map((f) => (f.id === faq.id ? { ...f, is_visible: !f.is_visible } : f)));
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const aiGenerate = async (
    id: string,
    type: 'faq' | 'faq_answer',
    lang: 'en' | 'ro',
    isEditing: boolean,
    contextQuestion?: string
  ) => {
    const categoryLabel = CATEGORIES.find(
      (c) => c.value === (isEditing ? editingFaq?.category : newFaq.category)
    )?.label;

    const result = await generate(id, {
      type,
      language: lang,
      category: categoryLabel,
      context: type === 'faq_answer' ? contextQuestion : undefined,
    });

    if (!result) {
      toast.error('AI generation failed. Please try again.');
      return;
    }

    if (isEditing && editingFaq) {
      if (type === 'faq') {
        setEditingFaq({ ...editingFaq, [`question_${lang}`]: result });
      } else {
        setEditingFaq({ ...editingFaq, [`answer_${lang}`]: result });
      }
    } else {
      if (type === 'faq') {
        setNewFaq({ ...newFaq, [`question_${lang}`]: result });
      } else {
        setNewFaq({ ...newFaq, [`answer_${lang}`]: result });
      }
    }
  };

  const filteredFaqs =
    activeCategory === 'all' ? faqs : faqs.filter((f) => f.category === activeCategory);

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const renderFaqForm = (isEditing: boolean) => {
    const faq = isEditing ? editingFaq! : newFaq;
    const setFaq = isEditing
      ? (val: Partial<typeof newFaq>) => setEditingFaq({ ...editingFaq!, ...val })
      : (val: Partial<typeof newFaq>) => setNewFaq({ ...newFaq, ...val });

    return (
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={faq.category}
            onChange={(e) => setFaq({ category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Question (English){!isEditing && ' *'}
              </label>
              <AIGenerateButton
                id={`q-en-${isEditing ? 'edit' : 'new'}`}
                generating={generating}
                onClick={() => aiGenerate(`q-en-${isEditing ? 'edit' : 'new'}`, 'faq', 'en', isEditing)}
                label="Generate"
              />
            </div>
            <input
              type="text"
              value={faq.question_en}
              onChange={(e) => setFaq({ question_en: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Question (Romanian)</label>
              <AIGenerateButton
                id={`q-ro-${isEditing ? 'edit' : 'new'}`}
                generating={generating}
                onClick={() => aiGenerate(`q-ro-${isEditing ? 'edit' : 'new'}`, 'faq', 'ro', isEditing)}
                label="Generate"
              />
            </div>
            <input
              type="text"
              value={faq.question_ro}
              onChange={(e) => setFaq({ question_ro: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Answer (English){!isEditing && ' *'}
            </label>
            <AIGenerateButton
              id={`a-en-${isEditing ? 'edit' : 'new'}`}
              generating={generating}
              onClick={() =>
                aiGenerate(
                  `a-en-${isEditing ? 'edit' : 'new'}`,
                  'faq_answer',
                  'en',
                  isEditing,
                  faq.question_en || 'general question about Petricani 22'
                )
              }
              label="Generate from question"
            />
          </div>
          <RichTextEditor
            value={faq.answer_en}
            onChange={(value) => setFaq({ answer_en: value })}
            placeholder="Enter the answer..."
            minHeight="120px"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Answer (Romanian)</label>
            <AIGenerateButton
              id={`a-ro-${isEditing ? 'edit' : 'new'}`}
              generating={generating}
              onClick={() =>
                aiGenerate(
                  `a-ro-${isEditing ? 'edit' : 'new'}`,
                  'faq_answer',
                  'ro',
                  isEditing,
                  faq.question_ro || faq.question_en || 'general question about Petricani 22'
                )
              }
              label="Generate from question"
            />
          </div>
          <RichTextEditor
            value={faq.answer_ro}
            onChange={(value) => setFaq({ answer_ro: value })}
            placeholder="Introduceti raspunsul..."
            minHeight="120px"
          />
        </div>

        {isEditing && editingFaq && (
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editingFaq.is_visible}
                onChange={(e) => setEditingFaq({ ...editingFaq, is_visible: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
            <span className="text-sm text-gray-700">Visible on website</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({faqs.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = faqs.filter((f) => f.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs yet</h3>
          <p className="text-gray-500 mb-6">Add your first FAQ to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(faq.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  {expandedFaqs.includes(faq.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{faq.question_en}</p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {getCategoryLabel(faq.category)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleVisibility(faq)}
                    className={`p-2 rounded-lg transition-colors ${
                      faq.is_visible
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {faq.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setEditingFaq(faq)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {expandedFaqs.includes(faq.id) && (
                <div className="border-t px-4 py-3 bg-gray-50">
                  <div
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer_en) }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">Add New FAQ</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFaqForm(false)}
            <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFaq}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {editingFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">Edit FAQ</h2>
              <button
                onClick={() => setEditingFaq(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFaqForm(true)}
            <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFaq}
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
    </div>
  );
}
