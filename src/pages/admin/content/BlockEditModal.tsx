import { Save, X, Image as ImageIcon } from 'lucide-react';
import AIGenerateButton from '../../../components/admin/AIGenerateButton';
import { useAIGenerate } from '../../../hooks/useAIGenerate';
import { useToast } from '../../../components/ui/Toast';

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

const BLOCK_TYPES = [
  { value: 'feature', label: 'Feature' },
  { value: 'amenity', label: 'Amenity' },
  { value: 'special_feature', label: 'Special Feature' },
  { value: 'cta_button', label: 'CTA Button' },
];

const ICON_OPTIONS = [
  'Home', 'Maximize', 'Bed', 'Bath', 'Calendar', 'Road', 'Settings', 'Car',
  'Wifi', 'Thermometer', 'Utensils', 'TreePine', 'Sofa', 'Sparkles', 'Washing',
  'Star', 'Heart', 'Check', 'Clock', 'MapPin', 'Phone', 'Mail', 'Globe',
];

interface BlockEditModalProps {
  block: ContentBlock;
  saving: boolean;
  mediaCache: Record<string, MediaItem>;
  onChange: (block: ContentBlock) => void;
  onSave: () => void;
  onClose: () => void;
  onSelectImage: () => void;
}

export default function BlockEditModal({
  block,
  saving,
  mediaCache,
  onChange,
  onSave,
  onClose,
  onSelectImage,
}: BlockEditModalProps) {
  const { generate, generating } = useAIGenerate();
  const toast = useToast();

  const aiGen = async (
    id: string,
    type: 'block_title' | 'block_description',
    lang: 'en' | 'ro'
  ) => {
    const context = block.title_en || block.title_ro || block.type;
    const existingTitle = lang === 'en' ? block.title_en : block.title_ro;

    const result = await generate(id, {
      type,
      language: lang,
      context: type === 'block_description' ? (existingTitle || context) : context,
    });

    if (!result) {
      toast.error('AI generation failed. Please try again.');
      return;
    }

    if (type === 'block_title') {
      onChange({ ...block, [`title_${lang}`]: result });
    } else {
      onChange({ ...block, [`description_${lang}`]: result });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
          <h2 className="text-xl font-semibold">Edit Content Block</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block Type</label>
              <select
                value={block.type}
                onChange={(e) => onChange({ ...block, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {BLOCK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select
                value={block.icon || ''}
                onChange={(e) => onChange({ ...block, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">No Icon</option>
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Title (English)</label>
                <AIGenerateButton
                  id="block-title-en"
                  generating={generating}
                  onClick={() => aiGen('block-title-en', 'block_title', 'en')}
                  label="Generate"
                />
              </div>
              <input
                type="text"
                value={block.title_en || ''}
                onChange={(e) => onChange({ ...block, title_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Title (Romanian)</label>
                <AIGenerateButton
                  id="block-title-ro"
                  generating={generating}
                  onClick={() => aiGen('block-title-ro', 'block_title', 'ro')}
                  label="Generate"
                />
              </div>
              <input
                type="text"
                value={block.title_ro || ''}
                onChange={(e) => onChange({ ...block, title_ro: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Description (English)</label>
                <AIGenerateButton
                  id="block-desc-en"
                  generating={generating}
                  onClick={() => aiGen('block-desc-en', 'block_description', 'en')}
                  label="Generate"
                />
              </div>
              <textarea
                value={block.description_en || ''}
                onChange={(e) => onChange({ ...block, description_en: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Description (Romanian)</label>
                <AIGenerateButton
                  id="block-desc-ro"
                  generating={generating}
                  onClick={() => aiGen('block-desc-ro', 'block_description', 'ro')}
                  label="Generate"
                />
              </div>
              <textarea
                value={block.description_ro || ''}
                onChange={(e) => onChange({ ...block, description_ro: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
            <input
              type="url"
              value={block.link_url || ''}
              onChange={(e) => onChange({ ...block, link_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <div className="flex items-center gap-4">
              {block.image_id && mediaCache[block.image_id] ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={mediaCache[block.image_id].url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onChange({ ...block, image_id: null })}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <button
                onClick={onSelectImage}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Select Image
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={block.is_visible}
                onChange={(e) => onChange({ ...block, is_visible: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
            <span className="text-sm text-gray-700">Block visible on website</span>
          </div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
