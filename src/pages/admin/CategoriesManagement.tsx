import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  GripVertical,
  Check,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name_en: string;
  name_ro: string;
  slug: string;
  slug_ro: string;
  description_en: string;
  description_ro: string;
  is_minibar: boolean;
  requires_advance_order: boolean;
  display_order: number;
  is_active: boolean;
}

interface CategoryForm {
  name_en: string;
  name_ro: string;
  slug: string;
  slug_ro: string;
  description_en: string;
  description_ro: string;
  is_minibar: boolean;
  requires_advance_order: boolean;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  name_en: '',
  name_ro: '',
  slug: '',
  slug_ro: '',
  description_en: '',
  description_ro: '',
  is_minibar: false,
  requires_advance_order: true,
  is_active: true,
};

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) {
      setCategories(data);
    }
    setLoading(false);
  }

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  }

  function openEditModal(category: Category) {
    setForm({
      name_en: category.name_en,
      name_ro: category.name_ro,
      slug: category.slug,
      slug_ro: category.slug_ro || '',
      description_en: category.description_en || '',
      description_ro: category.description_ro || '',
      is_minibar: category.is_minibar,
      requires_advance_order: category.requires_advance_order,
      is_active: category.is_active,
    });
    setEditingId(category.id);
    setError('');
    setShowModal(true);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const slug = form.slug || generateSlug(form.name_en);
    const slugRo = form.slug_ro || generateSlug(form.name_ro);

    if (editingId) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name_en: form.name_en,
          name_ro: form.name_ro,
          slug,
          slug_ro: slugRo,
          description_en: form.description_en,
          description_ro: form.description_ro,
          is_minibar: form.is_minibar,
          requires_advance_order: form.requires_advance_order,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const maxOrder = Math.max(...categories.map((c) => c.display_order), -1);

      const { error: insertError } = await supabase.from('categories').insert({
        name_en: form.name_en,
        name_ro: form.name_ro,
        slug,
        slug_ro: slugRo,
        description_en: form.description_en,
        description_ro: form.description_ro,
        is_minibar: form.is_minibar,
        requires_advance_order: form.requires_advance_order,
        is_active: form.is_active,
        display_order: maxOrder + 1,
      });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowModal(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setDeleteConfirm(null);
      fetchCategories();
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    await supabase
      .from('categories')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    fetchCategories();
  }

  async function updateOrder(id: string, direction: 'up' | 'down') {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const current = categories[index];
    const swap = categories[newIndex];

    await Promise.all([
      supabase
        .from('categories')
        .update({ display_order: swap.display_order })
        .eq('id', current.id),
      supabase
        .from('categories')
        .update({ display_order: current.display_order })
        .eq('id', swap.id),
    ]);

    fetchCategories();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your menu categories</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name (EN / RO)
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category, index) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => updateOrder(category.id, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => updateOrder(category.id, 'down')}
                        disabled={index === categories.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{category.name_en}</div>
                  <div className="text-sm text-gray-500">{category.name_ro}</div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {category.is_minibar && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Minibar
                      </span>
                    )}
                    {category.requires_advance_order && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        Advance Order
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(category.id, category.is_active)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      category.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category.is_active ? (
                      <>
                        <Check className="w-3 h-3 mr-1" /> Active
                      </>
                    ) : (
                      'Inactive'
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteConfirm === category.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No categories found. Create your first category to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Romanian) *
                  </label>
                  <input
                    type="text"
                    value={form.name_ro}
                    onChange={(e) => setForm({ ...form, name_ro: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug EN
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder={generateSlug(form.name_en) || 'Auto-generated from English name'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to auto-generate from English name
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug RO
                  </label>
                  <input
                    type="text"
                    value={form.slug_ro}
                    onChange={(e) => setForm({ ...form, slug_ro: e.target.value })}
                    placeholder={generateSlug(form.name_ro) || 'Auto-generated from Romanian name'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to auto-generate from Romanian name
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={form.description_en}
                    onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Romanian)
                  </label>
                  <textarea
                    value={form.description_ro}
                    onChange={(e) => setForm({ ...form, description_ro: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_minibar}
                    onChange={(e) => setForm({ ...form, is_minibar: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  />
                  <span className="text-gray-700">This is a minibar category</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requires_advance_order}
                    onChange={(e) =>
                      setForm({ ...form, requires_advance_order: e.target.checked })
                    }
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  />
                  <span className="text-gray-700">Requires advance order</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  />
                  <span className="text-gray-700">Active (visible to customers)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
