import { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  GripVertical,
  Home,
  Building,
  Bed,
  Star,
  Layout,
  TreePine,
  Waves,
  Coffee,
  Warehouse,
  Car,
  Pizza,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';

interface UnitType {
  id: string;
  slug: string;
  name_en: string;
  name_ro: string;
  icon: string;
  display_order: number;
  show_beds: boolean;
  show_guests: boolean;
  price_suffix_en: string;
  price_suffix_ro: string;
}

const ICON_OPTIONS = [
  { value: 'Home', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { value: 'Building', label: 'Building', icon: <Building className="w-4 h-4" /> },
  { value: 'Bed', label: 'Bed', icon: <Bed className="w-4 h-4" /> },
  { value: 'Star', label: 'Star', icon: <Star className="w-4 h-4" /> },
  { value: 'Layout', label: 'Layout', icon: <Layout className="w-4 h-4" /> },
  { value: 'TreePine', label: 'Tree', icon: <TreePine className="w-4 h-4" /> },
  { value: 'Waves', label: 'Waves', icon: <Waves className="w-4 h-4" /> },
  { value: 'Coffee', label: 'Coffee', icon: <Coffee className="w-4 h-4" /> },
  { value: 'Warehouse', label: 'Warehouse', icon: <Warehouse className="w-4 h-4" /> },
  { value: 'Car', label: 'Car', icon: <Car className="w-4 h-4" /> },
  { value: 'Pizza', label: 'Pizza', icon: <Pizza className="w-4 h-4" /> },
];

const emptyType: Omit<UnitType, 'id'> = {
  slug: '',
  name_en: '',
  name_ro: '',
  icon: 'Home',
  display_order: 0,
  show_beds: true,
  show_guests: true,
  price_suffix_en: 'night',
  price_suffix_ro: 'noapte',
};

export default function UnitTypesManagement() {
  const [types, setTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingType, setEditingType] = useState<UnitType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_types')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTypes(data || []);
    } catch (error) {
      console.error('Error fetching unit types:', error);
      toast.error('Failed to load unit types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType({
      id: '',
      ...emptyType,
      display_order: types.length,
    });
    setIsCreating(true);
  };

  const handleEdit = (type: UnitType) => {
    setEditingType(type);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingType) return;

    const typeData = {
      slug: editingType.slug,
      name_en: editingType.name_en,
      name_ro: editingType.name_ro,
      icon: editingType.icon,
      display_order: editingType.display_order,
      show_beds: editingType.show_beds,
      show_guests: editingType.show_guests,
      price_suffix_en: editingType.price_suffix_en,
      price_suffix_ro: editingType.price_suffix_ro,
    };

    setSaving(true);
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from('unit_types')
          .insert(typeData)
          .select()
          .single();

        if (error) throw error;
        setTypes([...types, data]);
        toast.success('Unit type created successfully');
      } else {
        const { error } = await supabase
          .from('unit_types')
          .update({ ...typeData, updated_at: new Date().toISOString() })
          .eq('id', editingType.id);

        if (error) throw error;
        setTypes(
          types.map((t) =>
            t.id === editingType.id ? editingType : t
          )
        );
        toast.success('Unit type updated successfully');
      }
      setEditingType(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving unit type:', error);
      toast.error('Failed to save unit type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: UnitType) => {
    const confirmed = await confirm({
      title: 'Delete Unit Type',
      message: `Delete "${type.name_en}"? Any rentals using this type will lose their classification. This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('unit_types').delete().eq('id', type.id);
      if (error) throw error;
      setTypes(types.filter((t) => t.id !== type.id));
      toast.success('Unit type deleted');
    } catch (error) {
      console.error('Error deleting unit type:', error);
      toast.error('Failed to delete unit type');
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
          <h1 className="text-2xl font-bold text-gray-900">Unit Types</h1>
          <p className="text-gray-600 mt-1">Manage physical classifications for rental units</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Type
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {types.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-400">
                      <GripVertical className="w-4 h-4 mr-1" />
                      {type.display_order}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getIconComponent(type.icon)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{type.name_en}</p>
                        <p className="text-sm text-gray-500">{type.name_ro}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                      {type.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type)}
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

      {editingType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {isCreating ? 'Add Unit Type' : 'Edit Unit Type'}
              </h2>
              <button
                onClick={() => {
                  setEditingType(null);
                  setIsCreating(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (unique identifier)
                </label>
                <input
                  type="text"
                  value={editingType.slug}
                  onChange={(e) =>
                    setEditingType({
                      ...editingType,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="e.g., deluxe-room"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English)
                  </label>
                  <input
                    type="text"
                    value={editingType.name_en}
                    onChange={(e) =>
                      setEditingType({ ...editingType, name_en: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Romanian)
                  </label>
                  <input
                    type="text"
                    value={editingType.name_ro}
                    onChange={(e) =>
                      setEditingType({ ...editingType, name_ro: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon.value}
                      onClick={() => setEditingType({ ...editingType, icon: icon.value })}
                      className={`p-3 flex flex-col items-center gap-1 rounded-lg border transition-all ${
                        editingType.icon === icon.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                      }`}
                    >
                      {icon.icon}
                      <span className="text-[10px] font-medium">{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_beds"
                  checked={editingType.show_beds}
                  onChange={(e) =>
                    setEditingType({ ...editingType, show_beds: e.target.checked })
                  }
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="show_beds" className="text-sm font-medium text-gray-700">
                  Show beds count for this type
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_guests"
                  checked={editingType.show_guests}
                  onChange={(e) =>
                    setEditingType({ ...editingType, show_guests: e.target.checked })
                  }
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="show_guests" className="text-sm font-medium text-gray-700">
                  Show guests count for this type
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Unit (EN)
                  </label>
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-2 border border-gray-300 rounded-lg">
                    <span>/</span>
                    <input
                      type="text"
                      value={editingType.price_suffix_en}
                      onChange={(e) =>
                        setEditingType({ ...editingType, price_suffix_en: e.target.value })
                      }
                      placeholder="night"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Unit (RO)
                  </label>
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-2 border border-gray-300 rounded-lg">
                    <span>/</span>
                    <input
                      type="text"
                      value={editingType.price_suffix_ro}
                      onChange={(e) =>
                        setEditingType({ ...editingType, price_suffix_ro: e.target.value })
                      }
                      placeholder="noapte"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingType.display_order}
                  onChange={(e) =>
                    setEditingType({
                      ...editingType,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setEditingType(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingType.slug || !editingType.name_en}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isCreating ? 'Create Type' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
