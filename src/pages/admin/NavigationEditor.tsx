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
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Menu,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';

interface NavMenuItem {
  id: string;
  location: string;
  parent_id: string | null;
  label_en: string;
  label_ro: string;
  url: string;
  icon: string | null;
  target: string;
  display_order: number;
  is_visible: boolean;
  children?: NavMenuItem[];
}

const LOCATIONS = [
  { value: 'header', label: 'Header Navigation' },
  { value: 'footer', label: 'Footer Links' },
  { value: 'footer_legal', label: 'Footer Legal' },
];

const ICON_OPTIONS = [
  '', 'Home', 'Menu', 'Settings', 'User', 'Mail', 'Phone', 'MapPin',
  'Calendar', 'Clock', 'Star', 'Heart', 'Info', 'HelpCircle',
];

export default function NavigationEditor() {
  const [menuItems, setMenuItems] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLocation, setActiveLocation] = useState('header');
  const [editingItem, setEditingItem] = useState<NavMenuItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    label_en: '',
    label_ro: '',
    url: '',
    icon: '',
    target: '_self',
    parent_id: null as string | null,
  });
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_menus')
        .select('*')
        .order('location')
        .order('display_order');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationItems = (location: string): NavMenuItem[] => {
    const items = menuItems.filter((item) => item.location === location && !item.parent_id);
    return items.map((item) => ({
      ...item,
      children: menuItems.filter((child) => child.parent_id === item.id),
    }));
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAddItem = async () => {
    if (!newItem.label_en.trim() || !newItem.url.trim()) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      const locationItems = menuItems.filter(
        (item) => item.location === activeLocation && item.parent_id === newItem.parent_id
      );

      const { data, error } = await supabase
        .from('navigation_menus')
        .insert({
          location: activeLocation,
          parent_id: newItem.parent_id,
          label_en: newItem.label_en,
          label_ro: newItem.label_ro || newItem.label_en,
          url: newItem.url,
          icon: newItem.icon || null,
          target: newItem.target,
          display_order: locationItems.length,
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems([...menuItems, data]);
      setShowAddModal(false);
      setNewItem({
        label_en: '',
        label_ro: '',
        url: '',
        icon: '',
        target: '_self',
        parent_id: null,
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('Failed to add menu item. Please try again.');
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('navigation_menus')
        .update({
          label_en: editingItem.label_en,
          label_ro: editingItem.label_ro,
          url: editingItem.url,
          icon: editingItem.icon,
          target: editingItem.target,
          is_visible: editingItem.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setMenuItems(
        menuItems.map((item) => (item.id === editingItem.id ? editingItem : item))
      );
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: NavMenuItem) => {
    const hasChildren = menuItems.some((child) => child.parent_id === item.id);
    if (hasChildren) {
      toast.warning('Please delete child items first');
      return;
    }

    const confirmed = await confirm({ title: 'Delete Menu Item', message: `Delete "${item.label_en}"?`, confirmLabel: 'Delete', variant: 'danger' });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('navigation_menus').delete().eq('id', item.id);
      if (error) throw error;
      setMenuItems(menuItems.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item. Please try again.');
    }
  };

  const toggleVisibility = async (item: NavMenuItem) => {
    try {
      const { error } = await supabase
        .from('navigation_menus')
        .update({ is_visible: !item.is_visible })
        .eq('id', item.id);

      if (error) throw error;
      setMenuItems(
        menuItems.map((i) => (i.id === item.id ? { ...i, is_visible: !i.is_visible } : i))
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const getParentOptions = () => {
    return menuItems.filter(
      (item) => item.location === activeLocation && !item.parent_id
    );
  };

  const renderMenuItem = (item: NavMenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    return (
      <div key={item.id}>
        <div
          className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 ${
            isChild ? 'ml-8' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
            {hasChildren && (
              <button
                onClick={() => toggleExpand(item.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            <div>
              <p className="font-medium text-gray-900">{item.label_en}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                {item.url}
                {item.target === '_blank' && (
                  <ExternalLink className="w-3 h-3 ml-1" />
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleVisibility(item)}
              className={`p-1.5 rounded transition-colors ${
                item.is_visible
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {item.is_visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setEditingItem(item)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteItem(item)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {item.children!.map((child) => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const locationItems = getLocationItems(activeLocation);

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
          <h1 className="text-2xl font-bold text-gray-900">Navigation Menus</h1>
          <p className="text-gray-600 mt-1">Manage website navigation links</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Menu Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b">
          <nav className="flex -mb-px">
            {LOCATIONS.map((location) => (
              <button
                key={location.value}
                onClick={() => setActiveLocation(location.value)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeLocation === location.value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {location.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {locationItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Menu className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No menu items in this location</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-primary hover:underline"
              >
                Add your first menu item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {locationItems.map((item) => renderMenuItem(item))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Add Menu Item</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (English) *
                  </label>
                  <input
                    type="text"
                    value={newItem.label_en}
                    onChange={(e) => setNewItem({ ...newItem, label_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (Romanian)
                  </label>
                  <input
                    type="text"
                    value={newItem.label_ro}
                    onChange={(e) => setNewItem({ ...newItem, label_ro: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="text"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder="/page or https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={newItem.icon}
                    onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">No Icon</option>
                    {ICON_OPTIONS.filter(Boolean).map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open In
                  </label>
                  <select
                    value={newItem.target}
                    onChange={(e) => setNewItem({ ...newItem, target: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="_self">Same Window</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
              </div>

              {activeLocation === 'header' && getParentOptions().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Item (for dropdown)
                  </label>
                  <select
                    value={newItem.parent_id || ''}
                    onChange={(e) =>
                      setNewItem({ ...newItem, parent_id: e.target.value || null })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">None (Top Level)</option>
                    {getParentOptions().map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.label_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Edit Menu Item</h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (English)
                  </label>
                  <input
                    type="text"
                    value={editingItem.label_en}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, label_en: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (Romanian)
                  </label>
                  <input
                    type="text"
                    value={editingItem.label_ro}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, label_ro: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={editingItem.icon || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, icon: e.target.value || null })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">No Icon</option>
                    {ICON_OPTIONS.filter(Boolean).map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open In
                  </label>
                  <select
                    value={editingItem.target}
                    onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="_self">Same Window</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_visible}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, is_visible: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="text-sm text-gray-700">Visible</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
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
