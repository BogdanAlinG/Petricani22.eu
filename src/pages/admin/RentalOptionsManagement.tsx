import { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  GripVertical,
  Home,
  Users,
  Bed,
  Calendar,
  Building,
  TreePine,
  Car,
  Warehouse,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';

interface RentalOption {
  id: string;
  slug: string;
  icon: string;
  title_en: string;
  title_ro: string;
  description_en: string;
  description_ro: string;
  features_en: string[];
  features_ro: string[];
  price_daily: number;
  price_weekly: number;
  price_monthly: number;
  price_yearly: number;
  display_order: number;
  is_visible: boolean;
}

const ICON_OPTIONS = [
  { value: 'Home', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { value: 'Users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { value: 'Bed', label: 'Bed', icon: <Bed className="w-4 h-4" /> },
  { value: 'Calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { value: 'Building', label: 'Building', icon: <Building className="w-4 h-4" /> },
  { value: 'TreePine', label: 'Tree', icon: <TreePine className="w-4 h-4" /> },
  { value: 'Car', label: 'Car', icon: <Car className="w-4 h-4" /> },
  { value: 'Warehouse', label: 'Warehouse', icon: <Warehouse className="w-4 h-4" /> },
];

const emptyOption: Omit<RentalOption, 'id'> = {
  slug: '',
  icon: 'Home',
  title_en: '',
  title_ro: '',
  description_en: '',
  description_ro: '',
  features_en: [],
  features_ro: [],
  price_daily: 0,
  price_weekly: 0,
  price_monthly: 0,
  price_yearly: 0,
  display_order: 0,
  is_visible: true,
};

export default function RentalOptionsManagement() {
  const [options, setOptions] = useState<RentalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingOption, setEditingOption] = useState<RentalOption | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [featuresInput, setFeaturesInput] = useState({ en: '', ro: '' });
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_options')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setOptions(data || []);
    } catch (error) {
      console.error('Error fetching rental options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingOption({
      id: '',
      ...emptyOption,
      display_order: options.length,
    });
    setFeaturesInput({ en: '', ro: '' });
    setIsCreating(true);
  };

  const handleEdit = (option: RentalOption) => {
    setEditingOption(option);
    setFeaturesInput({
      en: option.features_en.join(', '),
      ro: option.features_ro.join(', '),
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingOption) return;

    const featuresEn = featuresInput.en
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);
    const featuresRo = featuresInput.ro
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);

    const optionData = {
      slug: editingOption.slug,
      icon: editingOption.icon,
      title_en: editingOption.title_en,
      title_ro: editingOption.title_ro,
      description_en: editingOption.description_en,
      description_ro: editingOption.description_ro,
      features_en: featuresEn,
      features_ro: featuresRo,
      price_daily: Number(editingOption.price_daily),
      price_weekly: Number(editingOption.price_weekly),
      price_monthly: Number(editingOption.price_monthly),
      price_yearly: Number(editingOption.price_yearly),
      display_order: editingOption.display_order,
      is_visible: editingOption.is_visible,
    };

    setSaving(true);
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from('rental_options')
          .insert(optionData)
          .select()
          .single();

        if (error) throw error;
        setOptions([...options, data]);
      } else {
        const { error } = await supabase
          .from('rental_options')
          .update({ ...optionData, updated_at: new Date().toISOString() })
          .eq('id', editingOption.id);

        if (error) throw error;
        setOptions(
          options.map((o) =>
            o.id === editingOption.id
              ? { ...editingOption, features_en: featuresEn, features_ro: featuresRo }
              : o
          )
        );
      }
      setEditingOption(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving rental option:', error);
      toast.error('Failed to save rental option. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (option: RentalOption) => {
    const confirmed = await confirm({
      title: 'Delete Rental Option',
      message: `Delete "${option.title_en}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('rental_options').delete().eq('id', option.id);
      if (error) throw error;
      setOptions(options.filter((o) => o.id !== option.id));
    } catch (error) {
      console.error('Error deleting rental option:', error);
      toast.error('Failed to delete rental option. Please try again.');
    }
  };

  const toggleVisibility = async (option: RentalOption) => {
    try {
      const { error } = await supabase
        .from('rental_options')
        .update({ is_visible: !option.is_visible })
        .eq('id', option.id);

      if (error) throw error;
      setOptions(options.map((o) => (o.id === option.id ? { ...o, is_visible: !o.is_visible } : o)));
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find((i) => i.value === iconName);
    return iconOption?.icon || <Home className="w-4 h-4" />;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Rental Options</h1>
          <p className="text-gray-600 mt-1">Manage rental configurations and pricing</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Option
        </button>
      </div>

      {options.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rental options yet</h3>
          <p className="text-gray-500 mb-6">Add your first rental option to get started</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Option
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Option
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yearly
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {options.map((option) => (
                  <tr key={option.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center text-gray-400">
                        <GripVertical className="w-4 h-4 mr-1" />
                        {option.display_order + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getIconComponent(option.icon)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{option.title_en}</p>
                          <p className="text-sm text-gray-500">{option.title_ro}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-900">{option.price_daily} EUR</td>
                    <td className="px-4 py-4 text-gray-900">{option.price_weekly} EUR</td>
                    <td className="px-4 py-4 text-gray-900">{option.price_monthly} EUR</td>
                    <td className="px-4 py-4 text-gray-900">{option.price_yearly} EUR</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          option.is_visible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {option.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleVisibility(option)}
                          className={`p-2 rounded-lg transition-colors ${
                            option.is_visible
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={option.is_visible ? 'Hide' : 'Show'}
                        >
                          {option.is_visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(option)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(option)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingOption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">
                {isCreating ? 'Add Rental Option' : 'Edit Rental Option'}
              </h2>
              <button
                onClick={() => {
                  setEditingOption(null);
                  setIsCreating(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (unique identifier)
                  </label>
                  <input
                    type="text"
                    value={editingOption.slug}
                    onChange={(e) =>
                      setEditingOption({
                        ...editingOption,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    placeholder="e.g., complete-property"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={editingOption.icon}
                    onChange={(e) => setEditingOption({ ...editingOption, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={editingOption.title_en}
                    onChange={(e) =>
                      setEditingOption({ ...editingOption, title_en: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Romanian)
                  </label>
                  <input
                    type="text"
                    value={editingOption.title_ro}
                    onChange={(e) =>
                      setEditingOption({ ...editingOption, title_ro: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={editingOption.description_en}
                    onChange={(e) =>
                      setEditingOption({ ...editingOption, description_en: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Romanian)
                  </label>
                  <textarea
                    value={editingOption.description_ro}
                    onChange={(e) =>
                      setEditingOption({ ...editingOption, description_ro: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features (English) - comma separated
                  </label>
                  <textarea
                    value={featuresInput.en}
                    onChange={(e) => setFeaturesInput({ ...featuresInput, en: e.target.value })}
                    placeholder="e.g., 12 rooms, 6 bathrooms, Private garden"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features (Romanian) - comma separated
                  </label>
                  <textarea
                    value={featuresInput.ro}
                    onChange={(e) => setFeaturesInput({ ...featuresInput, ro: e.target.value })}
                    placeholder="e.g., 12 camere, 6 băi, Grădină privată"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing (EUR)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Daily</label>
                    <input
                      type="number"
                      value={editingOption.price_daily}
                      onChange={(e) =>
                        setEditingOption({
                          ...editingOption,
                          price_daily: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Weekly</label>
                    <input
                      type="number"
                      value={editingOption.price_weekly}
                      onChange={(e) =>
                        setEditingOption({
                          ...editingOption,
                          price_weekly: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monthly</label>
                    <input
                      type="number"
                      value={editingOption.price_monthly}
                      onChange={(e) =>
                        setEditingOption({
                          ...editingOption,
                          price_monthly: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Yearly</label>
                    <input
                      type="number"
                      value={editingOption.price_yearly}
                      onChange={(e) =>
                        setEditingOption({
                          ...editingOption,
                          price_yearly: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingOption.display_order}
                    onChange={(e) =>
                      setEditingOption({
                        ...editingOption,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingOption.is_visible}
                      onChange={(e) =>
                        setEditingOption({ ...editingOption, is_visible: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Visible on website</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setEditingOption(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingOption.slug || !editingOption.title_en}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isCreating ? 'Create Option' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
