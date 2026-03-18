import { useState } from 'react';
import { X, Save, Globe, Lock } from 'lucide-react';
import type { GuidebookCategory, GuidebookAccommodation } from './guidebook.types';
import { AVAILABLE_ICONS } from './guidebook.types';
import GuidebookIcon from './GuidebookIcon';

interface CategoryFormModalProps {
  category: Partial<GuidebookCategory> | null;
  accommodations: GuidebookAccommodation[];
  saving: boolean;
  onSave: (data: Partial<GuidebookCategory>) => void;
  onClose: () => void;
}

export default function CategoryFormModal({
  category,
  accommodations,
  saving,
  onSave,
  onClose,
}: CategoryFormModalProps) {
  const [form, setForm] = useState<Partial<GuidebookCategory>>({
    title_en: '',
    title_ro: '',
    icon: 'BookOpen',
    display_order: 0,
    accommodation_id: null,
    requires_pin: false,
    ...category,
  });

  const set = (updates: Partial<GuidebookCategory>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {category?.id ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
              <input
                type="text"
                value={form.title_en || ''}
                onChange={(e) => set({ title_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                placeholder="e.g. House Rules"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Romanian)</label>
              <input
                type="text"
                value={form.title_ro || ''}
                onChange={(e) => set({ title_ro: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                placeholder="e.g. Reguli Casă"
              />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => set({ accommodation_id: null })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  form.accommodation_id === null
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="w-4 h-4" />
                Global (All Guests)
              </button>
            </div>
            {accommodations.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Or link to a specific rental:</p>
                <div className="flex flex-wrap gap-2">
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
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">Require PIN</p>
                <p className="text-xs text-amber-600">Entire category is locked behind the rental PIN</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  title={icon.label}
                  onClick={() => set({ icon: icon.value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    form.icon === icon.value
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <GuidebookIcon name={icon.value} className="w-5 h-5" />
                  <span className="text-[10px] leading-none truncate w-full text-center">
                    {icon.label}
                  </span>
                </button>
              ))}
            </div>
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
            disabled={saving || (!form.title_en?.trim() && !form.title_ro?.trim())}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
