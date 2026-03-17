import { Save, X, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '../../../components/admin/RichTextEditor';
import AIGenerateButton from '../../../components/admin/AIGenerateButton';
import { useAIGenerate } from '../../../hooks/useAIGenerate';
import { useToast } from '../../../components/ui/Toast';

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

interface MediaItem {
  id: string;
  url: string;
  filename: string;
}

interface SectionEditModalProps {
  section: PageSection;
  saving: boolean;
  mediaCache: Record<string, MediaItem>;
  onChange: (section: PageSection) => void;
  onSave: () => void;
  onClose: () => void;
  onSelectImage: () => void;
}

export default function SectionEditModal({
  section,
  saving,
  mediaCache,
  onChange,
  onSave,
  onClose,
  onSelectImage,
}: SectionEditModalProps) {
  const { generate, generating } = useAIGenerate();
  const toast = useToast();

  const aiGen = async (
    id: string,
    type: 'section_title' | 'section_subtitle' | 'block_description',
    lang: 'en' | 'ro'
  ) => {
    const context = section.section;
    const existingTitle = lang === 'en' ? section.title_en : section.title_ro;

    const result = await generate(id, {
      type,
      language: lang,
      context,
      existingContent: type !== 'section_title' ? (existingTitle || undefined) : undefined,
    });

    if (!result) {
      toast.error('AI generation failed. Please try again.');
      return;
    }

    if (type === 'section_title') {
      onChange({ ...section, [`title_${lang}`]: result });
    } else if (type === 'section_subtitle') {
      onChange({ ...section, [`subtitle_${lang}`]: result });
    } else {
      onChange({ ...section, [`content_${lang}`]: result });
    }
  };

  const aiTranslate = async (
    id: string,
    field: 'title' | 'subtitle' | 'content',
    targetLang: 'en' | 'ro'
  ) => {
    const sourceLang = targetLang === 'en' ? 'ro' : 'en';
    const sourceValue = section[`${field}_${sourceLang}` as keyof PageSection] as string | null;

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

    onChange({ ...section, [`${field}_${targetLang}`]: result });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
          <h2 className="text-xl font-semibold">Edit Section</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Title (English)</label>
                <div className="flex gap-1">
                  <AIGenerateButton
                    id="sec-title-en"
                    generating={generating}
                    onClick={() => aiGen('sec-title-en', 'section_title', 'en')}
                  />
                  <AIGenerateButton
                    id="sec-title-en-tr"
                    generating={generating}
                    onClick={() => aiTranslate('sec-title-en-tr', 'title', 'ro')}
                    variant="translate"
                  />
                </div>
              </div>
              <input
                type="text"
                value={section.title_en || ''}
                onChange={(e) => onChange({ ...section, title_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Title (Romanian)</label>
                <div className="flex gap-1">
                  <AIGenerateButton
                    id="sec-title-ro"
                    generating={generating}
                    onClick={() => aiGen('sec-title-ro', 'section_title', 'ro')}
                  />
                  <AIGenerateButton
                    id="sec-title-ro-tr"
                    generating={generating}
                    onClick={() => aiTranslate('sec-title-ro-tr', 'title', 'en')}
                    variant="translate"
                  />
                </div>
              </div>
              <input
                type="text"
                value={section.title_ro || ''}
                onChange={(e) => onChange({ ...section, title_ro: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Subtitle (English)</label>
                <div className="flex gap-1">
                  <AIGenerateButton
                    id="sec-subtitle-en"
                    generating={generating}
                    onClick={() => aiGen('sec-subtitle-en', 'section_subtitle', 'en')}
                  />
                  <AIGenerateButton
                    id="sec-subtitle-en-tr"
                    generating={generating}
                    onClick={() => aiTranslate('sec-subtitle-en-tr', 'subtitle', 'ro')}
                    variant="translate"
                  />
                </div>
              </div>
              <input
                type="text"
                value={section.subtitle_en || ''}
                onChange={(e) => onChange({ ...section, subtitle_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Subtitle (Romanian)</label>
                <div className="flex gap-1">
                  <AIGenerateButton
                    id="sec-subtitle-ro"
                    generating={generating}
                    onClick={() => aiGen('sec-subtitle-ro', 'section_subtitle', 'ro')}
                  />
                  <AIGenerateButton
                    id="sec-subtitle-ro-tr"
                    generating={generating}
                    onClick={() => aiTranslate('sec-subtitle-ro-tr', 'subtitle', 'en')}
                    variant="translate"
                  />
                </div>
              </div>
              <input
                type="text"
                value={section.subtitle_ro || ''}
                onChange={(e) => onChange({ ...section, subtitle_ro: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Content (English)</label>
              <div className="flex gap-1">
                <AIGenerateButton
                  id="sec-content-en"
                  generating={generating}
                  onClick={() => aiGen('sec-content-en', 'block_description', 'en')}
                />
                <AIGenerateButton
                  id="sec-content-en-tr"
                  generating={generating}
                  onClick={() => aiTranslate('sec-content-en-tr', 'content', 'ro')}
                  variant="translate"
                />
              </div>
            </div>
            <RichTextEditor
              value={section.content_en || ''}
              onChange={(value) => onChange({ ...section, content_en: value })}
              placeholder="Enter content..."
              minHeight="150px"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Content (Romanian)</label>
              <div className="flex gap-1">
                <AIGenerateButton
                  id="sec-content-ro"
                  generating={generating}
                  onClick={() => aiGen('sec-content-ro', 'block_description', 'ro')}
                />
                <AIGenerateButton
                  id="sec-content-ro-tr"
                  generating={generating}
                  onClick={() => aiTranslate('sec-content-ro-tr', 'content', 'en')}
                  variant="translate"
                />
              </div>
            </div>
            <RichTextEditor
              value={section.content_ro || ''}
              onChange={(value) => onChange({ ...section, content_ro: value })}
              placeholder="Introduceti continutul..."
              minHeight="150px"
            />
          </div>

          {section.section === 'hero' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Video URL</label>
              <p className="text-xs text-gray-500 mb-2">Enter a direct video file URL (mp4). When set, the video plays as the hero background instead of the image.</p>
              <input
                type="url"
                value={(section.settings?.video_url as string) || ''}
                onChange={(e) =>
                  onChange({
                    ...section,
                    settings: { ...section.settings, video_url: e.target.value },
                  })
                }
                placeholder="https://example.com/hero-video.mp4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
              />
              {(section.settings?.video_url as string) && (
                <button
                  onClick={() =>
                    onChange({
                      ...section,
                      settings: { ...section.settings, video_url: '' },
                    })
                  }
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove video (use image instead)
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Image</label>
            <div className="flex items-center gap-4">
              {section.image_id && mediaCache[section.image_id] ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img src={mediaCache[section.image_id].url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onChange({ ...section, image_id: null })}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
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
                checked={section.is_visible}
                onChange={(e) => onChange({ ...section, is_visible: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
            <span className="text-sm text-gray-700">Section visible on website</span>
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
