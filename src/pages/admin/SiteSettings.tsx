import { useState, useEffect } from 'react';
import {
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Search as SearchIcon,
  FileText,
  Palette,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';

interface SiteSetting {
  id: string;
  key: string;
  value_en: string | null;
  value_ro: string | null;
  type: string;
  group: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
}

const SETTING_GROUPS = [
  { key: 'branding', label: 'Branding', icon: <Palette className="w-5 h-5" /> },
  { key: 'contact', label: 'Contact Info', icon: <Mail className="w-5 h-5" /> },
  { key: 'seo', label: 'SEO', icon: <SearchIcon className="w-5 h-5" /> },
  { key: 'footer', label: 'Footer', icon: <FileText className="w-5 h-5" /> },
  { key: 'general', label: 'General', icon: <SettingsIcon className="w-5 h-5" /> },
];

export default function SiteSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState('branding');
  const [editedSettings, setEditedSettings] = useState<Record<string, { value_en: string; value_ro: string }>>({});
  const [showNewSettingModal, setShowNewSettingModal] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value_en: '',
    value_ro: '',
    type: 'text',
    group: 'general',
    description: '',
  });
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);
  const [socialLinkForm, setSocialLinkForm] = useState({
    platform: '',
    url: '',
    icon: '',
  });
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchSettings();
    fetchSocialLinks();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('group')
        .order('key');

      if (error) throw error;
      setSettings(data || []);

      const initial: Record<string, { value_en: string; value_ro: string }> = {};
      data?.forEach((s) => {
        initial[s.key] = { value_en: s.value_en || '', value_ro: s.value_ro || '' };
      });
      setEditedSettings(initial);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
    }
  };

  const handleSettingChange = (key: string, field: 'value_en' | 'value_ro', value: string) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = settings
        .filter((s) => s.group === activeGroup)
        .map((s) => ({
          id: s.id,
          key: s.key,
          value_en: editedSettings[s.key]?.value_en || null,
          value_ro: editedSettings[s.key]?.value_ro || null,
          type: s.type,
          group: s.group,
          description: s.description,
          updated_at: new Date().toISOString(),
        }));

      const { error } = await supabase.from('site_settings').upsert(updates);

      if (error) throw error;
      toast.success('Settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async () => {
    if (!newSetting.key.trim()) {
      toast.warning('Please enter a setting key');
      return;
    }

    try {
      const { error } = await supabase.from('site_settings').insert({
        key: newSetting.key.toLowerCase().replace(/\s+/g, '_'),
        value_en: newSetting.value_en,
        value_ro: newSetting.value_ro,
        type: newSetting.type,
        group: newSetting.group,
        description: newSetting.description,
      });

      if (error) throw error;
      setShowNewSettingModal(false);
      setNewSetting({
        key: '',
        value_en: '',
        value_ro: '',
        type: 'text',
        group: 'general',
        description: '',
      });
      fetchSettings();
    } catch (error) {
      console.error('Error adding setting:', error);
      toast.error('Failed to add setting. Please try again.');
    }
  };

  const handleDeleteSetting = async (setting: SiteSetting) => {
    const confirmed = await confirm({ title: 'Delete Setting', message: `Delete setting "${setting.key}"?`, confirmLabel: 'Delete', variant: 'danger' });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('site_settings').delete().eq('id', setting.id);
      if (error) throw error;
      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete setting. Please try again.');
    }
  };

  const handleSaveSocialLink = async () => {
    try {
      if (editingSocialLink?.id) {
        const { error } = await supabase
          .from('social_links')
          .update({
            platform: socialLinkForm.platform,
            url: socialLinkForm.url,
            icon: socialLinkForm.icon,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSocialLink.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('social_links').insert({
          platform: socialLinkForm.platform,
          url: socialLinkForm.url,
          icon: socialLinkForm.icon,
          display_order: socialLinks.length,
        });

        if (error) throw error;
      }

      setEditingSocialLink(null);
      setSocialLinkForm({ platform: '', url: '', icon: '' });
      fetchSocialLinks();
    } catch (error) {
      console.error('Error saving social link:', error);
      toast.error('Failed to save social link. Please try again.');
    }
  };

  const handleDeleteSocialLink = async (link: SocialLink) => {
    const confirmed = await confirm({ title: 'Delete Social Link', message: `Delete ${link.platform} link?`, confirmLabel: 'Delete', variant: 'danger' });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('social_links').delete().eq('id', link.id);
      if (error) throw error;
      fetchSocialLinks();
    } catch (error) {
      console.error('Error deleting social link:', error);
      toast.error('Failed to delete social link. Please try again.');
    }
  };

  const toggleSocialLinkVisibility = async (link: SocialLink) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update({ is_visible: !link.is_visible })
        .eq('id', link.id);

      if (error) throw error;
      fetchSocialLinks();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const getInputType = (type: string) => {
    switch (type) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
  };

  const groupedSettings = settings.filter((s) => s.group === activeGroup);

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
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600 mt-1">Manage global site configuration</p>
        </div>
        <button
          onClick={() => setShowNewSettingModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Setting
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
            <nav className="space-y-1">
              {SETTING_GROUPS.map((group) => (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeGroup === group.key
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {group.icon}
                  <span>{group.label}</span>
                </button>
              ))}
              <button
                onClick={() => setActiveGroup('social')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeGroup === 'social'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>Social Links</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeGroup === 'social' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Social Media Links</h2>
                <button
                  onClick={() => {
                    setEditingSocialLink({} as SocialLink);
                    setSocialLinkForm({ platform: '', url: '', icon: '' });
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              </div>

              {socialLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No social links configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {socialLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleSocialLinkVisibility(link)}
                          className={`p-2 rounded-lg transition-colors ${
                            link.is_visible
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {link.is_visible ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <p className="font-medium capitalize">{link.platform}</p>
                          <p className="text-sm text-gray-500 truncate max-w-md">{link.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSocialLink(link);
                            setSocialLinkForm({
                              platform: link.platform,
                              url: link.url,
                              icon: link.icon || '',
                            });
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSocialLink(link)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold capitalize">
                  {SETTING_GROUPS.find((g) => g.key === activeGroup)?.label || activeGroup}
                </h2>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {groupedSettings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No settings in this category</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedSettings.map((setting) => (
                    <div key={setting.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <label className="block font-medium text-gray-900">
                            {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSetting(setting)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">English</label>
                          {setting.type === 'text' && setting.key.includes('description') ? (
                            <textarea
                              value={editedSettings[setting.key]?.value_en || ''}
                              onChange={(e) =>
                                handleSettingChange(setting.key, 'value_en', e.target.value)
                              }
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          ) : (
                            <input
                              type={getInputType(setting.type)}
                              value={editedSettings[setting.key]?.value_en || ''}
                              onChange={(e) =>
                                handleSettingChange(setting.key, 'value_en', e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Romanian</label>
                          {setting.type === 'text' && setting.key.includes('description') ? (
                            <textarea
                              value={editedSettings[setting.key]?.value_ro || ''}
                              onChange={(e) =>
                                handleSettingChange(setting.key, 'value_ro', e.target.value)
                              }
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          ) : (
                            <input
                              type={getInputType(setting.type)}
                              value={editedSettings[setting.key]?.value_ro || ''}
                              onChange={(e) =>
                                handleSettingChange(setting.key, 'value_ro', e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showNewSettingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Add New Setting</h2>
              <button
                onClick={() => setShowNewSettingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setting Key
                </label>
                <input
                  type="text"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                  placeholder="e.g., site_name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newSetting.type}
                    onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="url">URL</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <select
                    value={newSetting.group}
                    onChange={(e) => setNewSetting({ ...newSetting, group: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {SETTING_GROUPS.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  placeholder="Admin-facing description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value (English)
                  </label>
                  <input
                    type="text"
                    value={newSetting.value_en}
                    onChange={(e) => setNewSetting({ ...newSetting, value_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value (Romanian)
                  </label>
                  <input
                    type="text"
                    value={newSetting.value_ro}
                    onChange={(e) => setNewSetting({ ...newSetting, value_ro: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowNewSettingModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSetting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Add Setting
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSocialLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingSocialLink.id ? 'Edit Social Link' : 'Add Social Link'}
              </h2>
              <button
                onClick={() => setEditingSocialLink(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={socialLinkForm.platform}
                  onChange={(e) =>
                    setSocialLinkForm({ ...socialLinkForm, platform: e.target.value })
                  }
                  placeholder="e.g., Facebook, Instagram"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={socialLinkForm.url}
                  onChange={(e) => setSocialLinkForm({ ...socialLinkForm, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Lucide icon name)
                </label>
                <input
                  type="text"
                  value={socialLinkForm.icon}
                  onChange={(e) => setSocialLinkForm({ ...socialLinkForm, icon: e.target.value })}
                  placeholder="e.g., Facebook, Instagram"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setEditingSocialLink(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSocialLink}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
