import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  GripVertical,
  Wifi,
  Tv,
  Wind,
  Bath,
  Car,
  Flame,
  Coffee,
  Utensils,
  WashingMachine,
  Refrigerator,
  Microwave,
  AirVent,
  Dumbbell,
  TreePine,
  Waves,
  Bike,
  ShieldCheck,
  Lock,
  Bell,
  Cigarette,
  CigaretteOff,
  PawPrint,
  Baby,
  Shirt,
  Bed,
  Sofa,
  MonitorSmartphone,
  Gamepad2,
  Music,
  ChefHat,
  Droplets,
  Sun,
  Snowflake,
  Zap,
  Home,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import type { Amenity, AmenityCategory } from '../../types/accommodation';

const ICON_OPTIONS = [
  { value: 'Wifi', label: 'WiFi', icon: <Wifi className="w-4 h-4" /> },
  { value: 'Tv', label: 'TV', icon: <Tv className="w-4 h-4" /> },
  { value: 'Wind', label: 'A/C', icon: <Wind className="w-4 h-4" /> },
  { value: 'AirVent', label: 'Ventilation', icon: <AirVent className="w-4 h-4" /> },
  { value: 'Snowflake', label: 'Heating', icon: <Snowflake className="w-4 h-4" /> },
  { value: 'Bath', label: 'Bath/Shower', icon: <Bath className="w-4 h-4" /> },
  { value: 'Droplets', label: 'Hot Water', icon: <Droplets className="w-4 h-4" /> },
  { value: 'Car', label: 'Parking', icon: <Car className="w-4 h-4" /> },
  { value: 'Flame', label: 'BBQ/Fireplace', icon: <Flame className="w-4 h-4" /> },
  { value: 'Coffee', label: 'Coffee', icon: <Coffee className="w-4 h-4" /> },
  { value: 'Utensils', label: 'Kitchen', icon: <Utensils className="w-4 h-4" /> },
  { value: 'ChefHat', label: 'Chef', icon: <ChefHat className="w-4 h-4" /> },
  { value: 'WashingMachine', label: 'Washing Machine', icon: <WashingMachine className="w-4 h-4" /> },
  { value: 'Refrigerator', label: 'Fridge', icon: <Refrigerator className="w-4 h-4" /> },
  { value: 'Microwave', label: 'Microwave', icon: <Microwave className="w-4 h-4" /> },
  { value: 'Dumbbell', label: 'Gym', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'TreePine', label: 'Garden', icon: <TreePine className="w-4 h-4" /> },
  { value: 'Waves', label: 'Pool', icon: <Waves className="w-4 h-4" /> },
  { value: 'Bike', label: 'Bicycle', icon: <Bike className="w-4 h-4" /> },
  { value: 'ShieldCheck', label: 'Security', icon: <ShieldCheck className="w-4 h-4" /> },
  { value: 'Lock', label: 'Lock', icon: <Lock className="w-4 h-4" /> },
  { value: 'Bell', label: 'Alarm', icon: <Bell className="w-4 h-4" /> },
  { value: 'Cigarette', label: 'Smoking', icon: <Cigarette className="w-4 h-4" /> },
  { value: 'CigaretteOff', label: 'No Smoking', icon: <CigaretteOff className="w-4 h-4" /> },
  { value: 'PawPrint', label: 'Pets', icon: <PawPrint className="w-4 h-4" /> },
  { value: 'Baby', label: 'Baby', icon: <Baby className="w-4 h-4" /> },
  { value: 'Shirt', label: 'Laundry', icon: <Shirt className="w-4 h-4" /> },
  { value: 'Bed', label: 'Bed', icon: <Bed className="w-4 h-4" /> },
  { value: 'Sofa', label: 'Living Room', icon: <Sofa className="w-4 h-4" /> },
  { value: 'MonitorSmartphone', label: 'Smart Home', icon: <MonitorSmartphone className="w-4 h-4" /> },
  { value: 'Gamepad2', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
  { value: 'Music', label: 'Music', icon: <Music className="w-4 h-4" /> },
  { value: 'Sun', label: 'Balcony/Terrace', icon: <Sun className="w-4 h-4" /> },
  { value: 'Zap', label: 'Electric', icon: <Zap className="w-4 h-4" /> },
  { value: 'Home', label: 'Home', icon: <Home className="w-4 h-4" /> },
];

function getIconComponent(iconName: string) {
  return ICON_OPTIONS.find((i) => i.value === iconName)?.icon ?? <Home className="w-4 h-4" />;
}

function generateSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Category modal ───────────────────────────────────────────────────────────

interface CategoryModalProps {
  category: Partial<AmenityCategory> | null;
  isCreating: boolean;
  saving: boolean;
  onChange: (c: Partial<AmenityCategory>) => void;
  onSave: () => void;
  onClose: () => void;
}

function CategoryModal({ category, isCreating, saving, onChange, onSave, onClose }: CategoryModalProps) {
  if (!category) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{isCreating ? 'Add Category' : 'Edit Category'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
              <input
                type="text"
                value={category.name_en ?? ''}
                onChange={(e) => onChange({ ...category, name_en: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Romanian)</label>
              <input
                type="text"
                value={category.name_ro ?? ''}
                onChange={(e) => onChange({ ...category, name_ro: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={category.slug ?? ''}
                onChange={(e) => onChange({ ...category, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select
                value={category.icon ?? 'Home'}
                onChange={(e) => onChange({ ...category, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input
              type="number"
              value={category.display_order ?? 0}
              onChange={(e) => onChange({ ...category, display_order: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !category.name_en || !category.slug}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : isCreating ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Amenity modal ────────────────────────────────────────────────────────────

interface AmenityModalProps {
  amenity: Partial<Amenity> | null;
  categories: AmenityCategory[];
  isCreating: boolean;
  saving: boolean;
  onChange: (a: Partial<Amenity>) => void;
  onSave: () => void;
  onClose: () => void;
}

function AmenityModal({ amenity, categories, isCreating, saving, onChange, onSave, onClose }: AmenityModalProps) {
  if (!amenity) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{isCreating ? 'Add Amenity' : 'Edit Amenity'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={amenity.category_id ?? ''}
              onChange={(e) => onChange({ ...amenity, category_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
              <input
                type="text"
                value={amenity.name_en ?? ''}
                onChange={(e) => onChange({ ...amenity, name_en: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Romanian)</label>
              <input
                type="text"
                value={amenity.name_ro ?? ''}
                onChange={(e) => onChange({ ...amenity, name_ro: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={amenity.slug ?? ''}
                onChange={(e) => onChange({ ...amenity, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select
                value={amenity.icon ?? 'Home'}
                onChange={(e) => onChange({ ...amenity, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input
              type="number"
              value={amenity.display_order ?? 0}
              onChange={(e) => onChange({ ...amenity, display_order: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !amenity.name_en || !amenity.slug}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : isCreating ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AmenitiesManagement() {
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Partial<AmenityCategory> | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [editingAmenity, setEditingAmenity] = useState<Partial<Amenity> | null>(null);
  const [isCreatingAmenity, setIsCreatingAmenity] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catRes, amenRes] = await Promise.all([
        supabase.from('amenity_categories').select('*').order('display_order'),
        supabase.from('amenities').select('*').order('display_order'),
      ]);
      if (catRes.error) throw catRes.error;
      if (amenRes.error) throw amenRes.error;
      setCategories(catRes.data ?? []);
      setAmenities(amenRes.data ?? []);
      if (!selectedCategoryId && catRes.data?.length) {
        setSelectedCategoryId(catRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load amenities.');
    } finally {
      setLoading(false);
    }
  };

  // ── Category CRUD ──────────────────────────────────────────────────────────

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    setSaving(true);
    try {
      const data = {
        slug: editingCategory.slug!,
        name_en: editingCategory.name_en!,
        name_ro: editingCategory.name_ro ?? editingCategory.name_en!,
        icon: editingCategory.icon ?? 'Home',
        display_order: editingCategory.display_order ?? 0,
      };
      if (isCreatingCategory) {
        const { data: created, error } = await supabase
          .from('amenity_categories').insert(data).select().single();
        if (error) throw error;
        setCategories([...categories, created]);
        setSelectedCategoryId(created.id);
      } else {
        const { error } = await supabase
          .from('amenity_categories').update(data).eq('id', editingCategory.id!);
        if (error) throw error;
        setCategories(categories.map((c) => c.id === editingCategory.id ? { ...c, ...data } : c));
      }
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: AmenityCategory) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      message: `Delete "${cat.name_en}"? All amenities in this category will be uncategorized.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('amenity_categories').delete().eq('id', cat.id);
      if (error) throw error;
      setCategories(categories.filter((c) => c.id !== cat.id));
      if (selectedCategoryId === cat.id) setSelectedCategoryId(categories[0]?.id ?? null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category.');
    }
  };

  // ── Amenity CRUD ───────────────────────────────────────────────────────────

  const handleSaveAmenity = async () => {
    if (!editingAmenity) return;
    setSaving(true);
    try {
      const data = {
        slug: editingAmenity.slug!,
        name_en: editingAmenity.name_en!,
        name_ro: editingAmenity.name_ro ?? editingAmenity.name_en!,
        icon: editingAmenity.icon ?? 'Home',
        display_order: editingAmenity.display_order ?? 0,
        category_id: editingAmenity.category_id ?? null,
      };
      if (isCreatingAmenity) {
        const { data: created, error } = await supabase
          .from('amenities').insert(data).select().single();
        if (error) throw error;
        setAmenities([...amenities, created]);
      } else {
        const { error } = await supabase
          .from('amenities').update(data).eq('id', editingAmenity.id!);
        if (error) throw error;
        setAmenities(amenities.map((a) => a.id === editingAmenity.id ? { ...a, ...data } : a));
      }
      setEditingAmenity(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save amenity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAmenity = async (amenity: Amenity) => {
    const confirmed = await confirm({
      title: 'Delete Amenity',
      message: `Delete "${amenity.name_en}"? It will be removed from all rental units.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('amenities').delete().eq('id', amenity.id);
      if (error) throw error;
      setAmenities(amenities.filter((a) => a.id !== amenity.id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete amenity.');
    }
  };

  const visibleAmenities = selectedCategoryId
    ? amenities.filter((a) => a.category_id === selectedCategoryId)
    : amenities.filter((a) => !a.category_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
        <p className="text-gray-600 mt-1">Manage amenity categories and individual amenities shown on rental pages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Categories column ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => {
                setEditingCategory({ name_en: '', name_ro: '', slug: '', icon: 'Home', display_order: categories.length });
                setIsCreatingCategory(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                  selectedCategoryId === cat.id ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {getIconComponent(cat.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{cat.name_en}</p>
                  <p className="text-xs text-gray-500">
                    {amenities.filter((a) => a.category_id === cat.id).length} amenities
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setIsCreatingCategory(false); }}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500 text-sm">No categories yet</li>
            )}
          </ul>
        </div>

        {/* ── Amenities column ── */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">
              {selectedCategoryId
                ? categories.find((c) => c.id === selectedCategoryId)?.name_en ?? 'Amenities'
                : 'Uncategorized'}
            </h2>
            <button
              onClick={() => {
                setEditingAmenity({
                  name_en: '',
                  name_ro: '',
                  slug: '',
                  icon: 'Home',
                  display_order: visibleAmenities.length,
                  category_id: selectedCategoryId ?? null,
                });
                setIsCreatingAmenity(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Amenity
            </button>
          </div>

          {visibleAmenities.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 text-sm">
              No amenities in this category yet.<br />Click "Add Amenity" to create one.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">Order</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amenity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Romanian</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleAmenities.map((amenity) => (
                  <tr key={amenity.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <GripVertical className="w-3.5 h-3.5" />
                        {amenity.display_order}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{amenity.name_en}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{amenity.name_ro}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                        {getIconComponent(amenity.icon)}
                        <span>{amenity.icon}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingAmenity(amenity); setIsCreatingAmenity(false); }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAmenity(amenity)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CategoryModal
        category={editingCategory}
        isCreating={isCreatingCategory}
        saving={saving}
        onChange={setEditingCategory}
        onSave={handleSaveCategory}
        onClose={() => setEditingCategory(null)}
      />

      <AmenityModal
        amenity={editingAmenity}
        categories={categories}
        isCreating={isCreatingAmenity}
        saving={saving}
        onChange={setEditingAmenity}
        onSave={handleSaveAmenity}
        onClose={() => setEditingAmenity(null)}
      />
    </div>
  );
}
