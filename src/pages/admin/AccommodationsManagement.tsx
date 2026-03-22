import { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import ImageSelector from '../../components/admin/ImageSelector';
import AccommodationTable from './accommodations/AccommodationTable';
import AccommodationFormModal from './accommodations/AccommodationFormModal';
import type { Accommodation, Amenity, AmenityCategory } from '../../types/accommodation';

const emptyAccommodation: Omit<Accommodation, 'id' | 'created_at' | 'updated_at'> = {
  slug: '',
  slug_ro: '',
  title_en: '',
  title_ro: '',
  short_description_en: '',
  short_description_ro: '',
  description_en: '',
  description_ro: '',
  unit_type: 'room',
  beds: 1,
  bathrooms: 1,
  max_guests: 2,
  sqm: null,
  base_price_per_night: 0,
  price_weekly: 0,
  price_monthly: 0,
  price_yearly: 0,
  cleaning_fee: 0,
  minimum_nights: 1,
  maximum_nights: 365,
  check_in_time: '15:00',
  check_out_time: '11:00',
  thumbnail_url: null,
  display_order: 0,
  is_visible: true,
  is_featured: false,
  show_house_rules: true,
  guidebook_pin: null,
};

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text_en: string;
  alt_text_ro: string;
  display_order: number;
}

export default function AccommodationsManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [unitTypes, setUnitTypes] = useState<{ 
    slug: string; 
    name_en: string; 
    show_beds: boolean;
    show_guests: boolean;
    price_suffix_en: string;
    price_suffix_ro: string;
  }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showGallerySelector, setShowGallerySelector] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accRes, catRes, amenRes, typeRes] = await Promise.all([
        supabase.from('accommodations').select('*').order('display_order'),
        supabase.from('amenity_categories').select('*').order('display_order'),
        supabase.from('amenities').select('*').order('display_order'),
        supabase.from('unit_types').select('slug, name_en, show_beds, show_guests, price_suffix_en, price_suffix_ro').order('display_order'),
      ]);
      setAccommodations(accRes.data || []);
      setAmenityCategories(catRes.data || []);
      setAmenities(amenRes.data || []);
      setUnitTypes(typeRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccommodationAmenities = async (accommodationId: string) => {
    const { data } = await supabase
      .from('accommodation_amenities')
      .select('amenity_id')
      .eq('accommodation_id', accommodationId);
    setSelectedAmenities((data || []).map((a: { amenity_id: string }) => a.amenity_id));
  };

  const fetchGalleryImages = async (accommodationId: string) => {
    const { data } = await supabase
      .from('accommodation_images')
      .select('*')
      .eq('accommodation_id', accommodationId)
      .order('display_order');
    setGalleryImages(data || []);
  };

  const handleCreate = () => {
    setEditing({
      id: '',
      ...emptyAccommodation,
      display_order: accommodations.length,
      created_at: '',
      updated_at: '',
    });
    setSelectedAmenities([]);
    setGalleryImages([]);
    setIsCreating(true);
    setActiveTab('basic');
  };

  const handleEdit = async (acc: Accommodation) => {
    setEditing(acc);
    setIsCreating(false);
    setActiveTab('basic');
    await Promise.all([
      fetchAccommodationAmenities(acc.id),
      fetchGalleryImages(acc.id),
    ]);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const accData = {
        slug: editing.slug,
        slug_ro: editing.slug_ro,
        title_en: editing.title_en,
        title_ro: editing.title_ro,
        short_description_en: editing.short_description_en,
        short_description_ro: editing.short_description_ro,
        description_en: editing.description_en,
        description_ro: editing.description_ro,
        unit_type: editing.unit_type,
        beds: Number(editing.beds),
        bathrooms: Number(editing.bathrooms),
        max_guests: Number(editing.max_guests),
        sqm: editing.sqm ? Number(editing.sqm) : null,
        base_price_per_night: Number(editing.base_price_per_night),
        price_weekly: Number(editing.price_weekly),
        price_monthly: Number(editing.price_monthly),
        price_yearly: Number(editing.price_yearly),
        cleaning_fee: Number(editing.cleaning_fee),
        minimum_nights: Number(editing.minimum_nights),
        maximum_nights: Number(editing.maximum_nights),
        check_in_time: editing.check_in_time,
        check_out_time: editing.check_out_time,
        thumbnail_url: editing.thumbnail_url,
        display_order: editing.display_order,
        is_visible: editing.is_visible,
        is_featured: editing.is_featured,
        show_house_rules: editing.show_house_rules,
        guidebook_pin: editing.guidebook_pin || null,
      };

      let savedId = editing.id;

      if (isCreating) {
        const { data, error } = await supabase.from('accommodations').insert(accData).select().single();
        if (error) throw new Error(`Insert failed: ${error.message} (${error.code})`);
        savedId = data.id;
        setAccommodations([...accommodations, data]);
      } else {
        const { error } = await supabase
          .from('accommodations')
          .update({ ...accData, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw new Error(`Update failed: ${error.message} (${error.code})`);
        setAccommodations(accommodations.map((a) => (a.id === editing.id ? { ...editing } : a)));
      }

      const { error: deleteError } = await supabase
        .from('accommodation_amenities')
        .delete()
        .eq('accommodation_id', savedId);
      if (deleteError) console.error('Amenities delete error:', deleteError);

      if (selectedAmenities.length > 0) {
        const amenityLinks = selectedAmenities.map((amenityId) => ({
          accommodation_id: savedId,
          amenity_id: amenityId,
        }));
        const { error: insertError } = await supabase.from('accommodation_amenities').insert(amenityLinks);
        if (insertError) console.error('Amenities insert error:', insertError);
      }

      setEditing(null);
      setIsCreating(false);
      fetchData();
    } catch (err: unknown) {
      console.error('Error saving accommodation:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : (err && typeof err === 'object' && 'message' in err)
          ? String((err as { message: string }).message)
          : 'Unknown error';
      toast.error(`Failed to save rental: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (acc: Accommodation) => {
    const confirmed = await confirm({
      title: 'Delete Rental',
      message: `Delete "${acc.title_en}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('accommodations').delete().eq('id', acc.id);
      if (error) throw error;
      setAccommodations(accommodations.filter((a) => a.id !== acc.id));
    } catch (err) {
      console.error('Error deleting accommodation:', err);
      toast.error('Failed to delete rental');
    }
  };

  const toggleVisibility = async (acc: Accommodation) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ is_visible: !acc.is_visible })
        .eq('id', acc.id);
      if (error) throw error;
      setAccommodations(accommodations.map((a) => (a.id === acc.id ? { ...a, is_visible: !a.is_visible } : a)));
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-gray-600 mt-1">Manage your rental units</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Rental
        </button>
      </div>

      <AccommodationTable
        accommodations={accommodations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={toggleVisibility}
        onCreate={handleCreate}
      />

      {editing && (
        <AccommodationFormModal
          editing={editing}
          isCreating={isCreating}
          saving={saving}
          activeTab={activeTab}
          unitTypes={unitTypes}
          selectedAmenities={selectedAmenities}
          amenityCategories={amenityCategories}
          amenities={amenities}
          galleryImages={galleryImages}
          onTabChange={setActiveTab}
          onFieldChange={(updates) => setEditing({ ...editing, ...updates })}
          onToggleAmenity={(amenityId) =>
            setSelectedAmenities((prev) =>
              prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
            )
          }
          onSave={handleSave}
          onClose={() => { setEditing(null); setIsCreating(false); }}
          onSelectThumbnail={() => setShowImageSelector(true)}
          onSelectGalleryImage={() => setShowGallerySelector(true)}
          onGalleryReorder={setGalleryImages}
          onGalleryRemove={(imageId) => setGalleryImages(galleryImages.filter((g) => g.id !== imageId))}
        />
      )}

      {showImageSelector && (
        <ImageSelector
          value={null}
          onChange={(items) => {
            const selected = items[0];
            if (selected) {
              setEditing(editing ? { ...editing, thumbnail_url: selected.url } : null);
            }
          }}
          onClose={() => setShowImageSelector(false)}
          suggestedFolder="accommodations"
        />
      )}

      {showGallerySelector && editing && (
        <ImageSelector
          value={null}
          multiple={true}
          onChange={async (items) => {
            if (items.length === 0 || !editing.id) return;
            
            const baseOrder = galleryImages.length > 0
              ? Math.max(...galleryImages.map((g) => g.display_order)) + 1
              : 0;

            const newImages = items.map((item, index) => ({
              accommodation_id: editing.id,
              image_url: item.url,
              alt_text_en: '',
              alt_text_ro: '',
              display_order: baseOrder + index,
            }));

            const { data, error } = await supabase
              .from('accommodation_images')
              .insert(newImages)
              .select();

            if (!error && data) {
              setGalleryImages([...galleryImages, ...data]);
            } else if (error) {
              console.error('Error inserting gallery images:', error);
              toast.error('Failed to add some images to the gallery');
            }
          }}
          onClose={() => setShowGallerySelector(false)}
          suggestedFolder="accommodations"
        />
      )}
    </div>
  );
}
