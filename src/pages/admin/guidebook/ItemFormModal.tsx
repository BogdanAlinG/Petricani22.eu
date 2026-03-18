import { useState } from 'react';
import { X, Save, Globe, Image as ImageIcon, Trash2, Lock } from 'lucide-react';
import type { GuidebookItem, GuidebookCategory, GuidebookAccommodation } from './guidebook.types';
import ImageSelector from '../../../components/admin/ImageSelector';

interface ItemFormModalProps {
  item: Partial<GuidebookItem> | null;
  categories: GuidebookCategory[];
  accommodations: GuidebookAccommodation[];
  saving: boolean;
  onSave: (data: Partial<GuidebookItem>) => void;
  onClose: () => void;
}

export default function ItemFormModal({
  item,
  categories,
  accommodations,
  saving,
  onSave,
  onClose,
}: ItemFormModalProps) {
  const [form, setForm] = useState<Partial<GuidebookItem>>({
    title_en: '',
    title_ro: '',
    content_en: '',
    content_ro: '',
    image_url: null,
    display_order: 0,
    accommodation_id: null,
    category_id: categories[0]?.id || '',
    requires_pin: false,
    ...item,
  });
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<'en' | 'ro'>('en');

  const set = (updates: Partial<GuidebookItem>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {item?.id ? 'Edit Item' : 'New Item'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category_id || ''}
                onChange={(e) => set({ category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title_en}
                    {cat.accommodation_id ? ' (Rental-specific)' : ' (Global)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => set({ accommodation_id: null })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    form.accommodation_id === null
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Global
                </button>
                {accommodations.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => set({ accommodation_id: acc.id })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      form.accommodation_id === acc.id
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {acc.title_en}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Require PIN</p>
                  <p className="text-xs text-amber-600">Guests must enter the rental PIN to view this item</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set({ requires_pin: !form.requires_pin })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  form.requires_pin ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
                    form.requires_pin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex border-b">
                {(['en', 'ro'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTab(lang)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === lang
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {lang === 'en' ? 'English' : 'Romanian'}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={activeTab === 'en' ? (form.title_en || '') : (form.title_ro || '')}
                    onChange={(e) =>
                      set(activeTab === 'en' ? { title_en: e.target.value } : { title_ro: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    placeholder={activeTab === 'en' ? 'e.g. Wi-Fi Password' : 'e.g. Parolă Wi-Fi'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content (Markdown supported)
                  </label>
                  <textarea
                    value={activeTab === 'en' ? (form.content_en || '') : (form.content_ro || '')}
                    onChange={(e) =>
                      set(activeTab === 'en' ? { content_en: e.target.value } : { content_ro: e.target.value })
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm font-mono"
                    placeholder={
                      activeTab === 'en'
                        ? '**Network:** Petricani22\n**Password:** welcome2024\n\nConnect from any device.'
                        : '**Rețea:** Petricani22\n**Parolă:** welcome2024'
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Use **bold**, *italic*, `code`, and - list items
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.display_order ?? 0}
                onChange={(e) => set({ display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image (optional)</label>
              {form.image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={form.image_url}
                    alt="Item"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImageSelector(true)}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors shadow-sm"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ image_url: null })}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowImageSelector(true)}
                  className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  <ImageIcon className="w-5 h-5" />
                  Add Image
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={saving || (!form.title_en?.trim() && !form.title_ro?.trim()) || !form.category_id}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </div>
      </div>

      {showImageSelector && (
        <ImageSelector
          value={null}
          onChange={(items) => {
            if (items.length > 0) set({ image_url: items[0].url });
            setShowImageSelector(false);
          }}
          onClose={() => setShowImageSelector(false)}
          suggestedFolder="guidebook"
        />
      )}
    </>
  );
}
