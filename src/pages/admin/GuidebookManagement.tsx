import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Globe, ChevronDown, ChevronRight,
  BookOpen, ExternalLink, RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { GuidebookCategory, GuidebookItem, GuidebookAccommodation } from './guidebook/guidebook.types';
import CategoryFormModal from './guidebook/CategoryFormModal';
import ItemFormModal from './guidebook/ItemFormModal';
import GuidebookIcon from './guidebook/GuidebookIcon';

export default function GuidebookManagement() {
  const toast = useToast();
  const confirm = useConfirm();

  const [categories, setCategories] = useState<GuidebookCategory[]>([]);
  const [items, setItems] = useState<GuidebookItem[]>([]);
  const [accommodations, setAccommodations] = useState<GuidebookAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterAccId, setFilterAccId] = useState<string | null | 'global'>('global');

  const [editingCategory, setEditingCategory] = useState<Partial<GuidebookCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<GuidebookItem> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, accRes] = await Promise.all([
        supabase
          .from('guidebook_categories')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('guidebook_items')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('accommodations')
          .select('id, title_en, title_ro, slug')
          .order('display_order', { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;
      if (accRes.error) throw accRes.error;

      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
      setAccommodations(accRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load guidebook data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpanded = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveCategory = async (data: Partial<GuidebookCategory>) => {
    setSaving(true);
    try {
      const payload = {
        title_en: data.title_en || '',
        title_ro: data.title_ro || '',
        icon: data.icon || 'BookOpen',
        display_order: data.display_order ?? 0,
        accommodation_id: data.accommodation_id ?? null,
        requires_pin: data.requires_pin ?? false,
        updated_at: new Date().toISOString(),
      };

      if (data.id) {
        const { error } = await supabase
          .from('guidebook_categories')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('guidebook_categories')
          .insert(payload);
        if (error) throw error;
        toast.success('Category created');
      }
      setEditingCategory(null);
      if (data.accommodation_id === null || data.accommodation_id === undefined) {
        setFilterAccId('global');
      } else {
        setFilterAccId(data.accommodation_id);
      }
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItem = async (data: Partial<GuidebookItem>) => {
    setSaving(true);
    try {
      const payload = {
        category_id: data.category_id!,
        accommodation_id: data.accommodation_id ?? null,
        title_en: data.title_en || '',
        title_ro: data.title_ro || '',
        content_en: data.content_en || '',
        content_ro: data.content_ro || '',
        image_url: data.image_url ?? null,
        display_order: data.display_order ?? 0,
        requires_pin: data.requires_pin ?? false,
        updated_at: new Date().toISOString(),
      };

      if (data.id) {
        const { error } = await supabase
          .from('guidebook_items')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { error } = await supabase
          .from('guidebook_items')
          .insert(payload);
        if (error) throw error;
        toast.success('Item created');
      }
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${label}"? All items in this category will also be deleted.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      const { error } = await supabase
        .from('guidebook_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteItem = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${label}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      const { error } = await supabase
        .from('guidebook_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item');
    }
  };

  const handleMoveItem = async (item: GuidebookItem, direction: 'up' | 'down') => {
    const siblings = items
      .filter((i) => i.category_id === item.category_id)
      .sort((a, b) => a.display_order - b.display_order);
    const idx = siblings.findIndex((i) => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const swapItem = siblings[swapIdx];
    await Promise.all([
      supabase.from('guidebook_items').update({ display_order: swapItem.display_order }).eq('id', item.id),
      supabase.from('guidebook_items').update({ display_order: item.display_order }).eq('id', swapItem.id),
    ]);
    fetchData();
  };

  const visibleCategories = categories.filter((cat) => {
    if (filterAccId === 'global') return cat.accommodation_id === null;
    if (filterAccId === null) return true;
    return cat.accommodation_id === filterAccId || cat.accommodation_id === null;
  });

  const getItemsForCategory = (catId: string, accId: string | null | 'global') => {
    return items.filter((item) => {
      if (item.category_id !== catId) return false;
      if (accId === 'global') return item.accommodation_id === null;
      if (accId === null) return true;
      return item.accommodation_id === null || item.accommodation_id === accId;
    });
  };

  const selectedAccommodation = accommodations.find((a) => a.id === filterAccId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="Loading guidebook..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Guidebook</h1>
            <p className="text-sm text-gray-500">Manage guest guides for your property</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setEditingCategory({})}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
          <button
            onClick={() => setEditingItem({ accommodation_id: filterAccId === 'global' ? null : (filterAccId as string | null) })}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Viewing context:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterAccId('global')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              filterAccId === 'global'
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Content
          </button>
          {accommodations.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setFilterAccId(acc.id)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                filterAccId === acc.id
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {acc.title_en}
            </button>
          ))}
          {filterAccId !== 'global' && filterAccId !== null && (
            <a
              href={`/guide/${selectedAccommodation?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Guest View
            </a>
          )}
        </div>
        {filterAccId !== 'global' && filterAccId !== null && (
          <p className="text-xs text-gray-500 mt-2">
            Showing global items + items specific to <strong>{selectedAccommodation?.title_en}</strong>
          </p>
        )}
      </div>

      <div className="space-y-3">
        {visibleCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No categories found</p>
            <p className="text-sm text-gray-400">Create a category to get started</p>
          </div>
        ) : (
          visibleCategories.map((cat) => {
            const catItems = getItemsForCategory(cat.id, filterAccId);
            const isExpanded = expandedCategories.has(cat.id);

            return (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpanded(cat.id)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                      cat.accommodation_id ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <GuidebookIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{cat.title_en}</span>
                        {cat.accommodation_id ? (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                            {accommodations.find((a) => a.id === cat.accommodation_id)?.title_en || 'Unit'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{cat.title_ro} &middot; {catItems.length} items &middot; order: {cat.display_order}</p>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.title_en)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {catItems.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        No items in this category.{' '}
                        <button
                          onClick={() => setEditingItem({ category_id: cat.id, accommodation_id: cat.accommodation_id })}
                          className="text-primary underline"
                        >
                          Add one
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {catItems.map((item, idx) => (
                          <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                              <button
                                onClick={() => handleMoveItem(item, 'up')}
                                disabled={idx === 0}
                                className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                              </button>
                              <button
                                onClick={() => handleMoveItem(item, 'down')}
                                disabled={idx === catItems.length - 1}
                                className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.title_en}
                                className="w-12 h-12 object-cover rounded-lg shrink-0"
                                loading="lazy"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm text-gray-900 truncate">{item.title_en}</span>
                                {item.accommodation_id ? (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded shrink-0">
                                    {accommodations.find((a) => a.id === item.accommodation_id)?.title_en}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded shrink-0">
                                    Global
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2">{item.content_en}</p>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.title_en)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="px-4 py-2 border-t border-gray-100">
                      <button
                        onClick={() => setEditingItem({ category_id: cat.id, accommodation_id: cat.accommodation_id })}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Plus className="w-4 h-4" />
                        Add item to this category
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {editingCategory !== null && (
        <CategoryFormModal
          category={editingCategory}
          accommodations={accommodations}
          saving={saving}
          onSave={handleSaveCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {editingItem !== null && (
        <ItemFormModal
          item={editingItem}
          categories={categories}
          accommodations={accommodations}
          saving={saving}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}

    </div>
  );
}
