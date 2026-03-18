import { useState } from 'react';
import { Save, X, Image as ImageIcon, Lock, Eye, EyeOff } from 'lucide-react';
import type { Accommodation, Amenity, AmenityCategory } from '../../../types/accommodation';
import GalleryTab from './GalleryTab';
import AmenitiesTab from './AmenitiesTab';

const UNIT_TYPES = [
  { value: 'room', label: 'Room' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'suite', label: 'Suite' },
  { value: 'studio', label: 'Studio' },
];

const TABS = ['basic', 'gallery', 'content', 'pricing', 'amenities'] as const;

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text_en: string;
  alt_text_ro: string;
  display_order: number;
}

interface AccommodationFormModalProps {
  editing: Accommodation;
  isCreating: boolean;
  saving: boolean;
  activeTab: string;
  selectedAmenities: string[];
  amenityCategories: AmenityCategory[];
  amenities: Amenity[];
  galleryImages: GalleryImage[];
  onTabChange: (tab: string) => void;
  onFieldChange: (updates: Partial<Accommodation>) => void;
  onToggleAmenity: (amenityId: string) => void;
  onSave: () => void;
  onClose: () => void;
  onSelectThumbnail: () => void;
  onSelectGalleryImage: () => void;
  onGalleryReorder: (images: GalleryImage[]) => void;
  onGalleryRemove: (imageId: string) => void;
}

export default function AccommodationFormModal({
  editing,
  isCreating,
  saving,
  activeTab,
  selectedAmenities,
  amenityCategories,
  amenities,
  galleryImages,
  onTabChange,
  onFieldChange,
  onToggleAmenity,
  onSave,
  onClose,
  onSelectThumbnail,
  onSelectGalleryImage,
  onGalleryReorder,
  onGalleryRemove,
}: AccommodationFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl my-8 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-xl z-10">
          <h2 className="text-xl font-semibold">
            {isCreating ? 'Add Accommodation' : 'Edit Accommodation'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex gap-1 p-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'basic' && (
            <BasicTab editing={editing} onFieldChange={onFieldChange} onSelectThumbnail={onSelectThumbnail} />
          )}
          {activeTab === 'gallery' && (
            <GalleryTab
              images={galleryImages}
              isCreating={isCreating}
              accommodationId={editing.id}
              thumbnailUrl={editing.thumbnail_url}
              onAddImage={onSelectGalleryImage}
              onReorder={onGalleryReorder}
              onRemove={onGalleryRemove}
            />
          )}
          {activeTab === 'content' && <ContentTab editing={editing} onFieldChange={onFieldChange} />}
          {activeTab === 'pricing' && <PricingTab editing={editing} onFieldChange={onFieldChange} />}
          {activeTab === 'amenities' && (
            <AmenitiesTab
              amenityCategories={amenityCategories}
              amenities={amenities}
              selectedAmenities={selectedAmenities}
              onToggle={onToggleAmenity}
            />
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !editing.slug || !editing.title_en}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isCreating ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BasicTab({
  editing,
  onFieldChange,
  onSelectThumbnail,
}: {
  editing: Accommodation;
  onFieldChange: (updates: Partial<Accommodation>) => void;
  onSelectThumbnail: () => void;
}) {
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug EN (URL identifier)</label>
          <input
            type="text"
            value={editing.slug}
            onChange={(e) => onFieldChange({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g., deluxe-suite"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug RO (URL identifier)</label>
          <input
            type="text"
            value={editing.slug_ro}
            onChange={(e) => onFieldChange({ slug_ro: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g., camera-deluxe"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
          <select
            value={editing.unit_type}
            onChange={(e) => onFieldChange({ unit_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {UNIT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
          <input
            type="text"
            value={editing.title_en}
            onChange={(e) => onFieldChange({ title_en: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (Romanian)</label>
          <input
            type="text"
            value={editing.title_ro}
            onChange={(e) => onFieldChange({ title_ro: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
          <input
            type="number"
            min="0"
            value={editing.beds}
            onChange={(e) => onFieldChange({ beds: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={editing.bathrooms}
            onChange={(e) => onFieldChange({ bathrooms: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
          <input
            type="number"
            min="1"
            value={editing.max_guests}
            onChange={(e) => onFieldChange({ max_guests: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size (sqm)</label>
          <input
            type="number"
            min="0"
            value={editing.sqm || ''}
            onChange={(e) => onFieldChange({ sqm: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
        <div className="flex items-center gap-4">
          {editing.thumbnail_url ? (
            <img src={editing.thumbnail_url} alt="" className="w-32 h-24 object-cover rounded-lg" />
          ) : (
            <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <button
            type="button"
            onClick={onSelectThumbnail}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {editing.thumbnail_url ? 'Change Image' : 'Select Image'}
          </button>
          {editing.thumbnail_url && (
            <button
              type="button"
              onClick={() => onFieldChange({ thumbnail_url: null })}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editing.is_visible}
            onChange={(e) => onFieldChange({ is_visible: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Visible on website</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editing.is_featured}
            onChange={(e) => onFieldChange({ is_featured: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Featured</span>
        </label>
      </div>

      <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-amber-600" />
          <label className="text-sm font-semibold text-amber-900">Guidebook PIN</label>
        </div>
        <p className="text-xs text-amber-700">
          Guests must enter this PIN to view protected content in the digital guidebook. Change it between bookings.
          Leave empty to disable PIN protection.
        </p>
        <div className="relative mt-2">
          <input
            type={showPin ? 'text' : 'password'}
            value={editing.guidebook_pin || ''}
            onChange={(e) => onFieldChange({ guidebook_pin: e.target.value || null })}
            placeholder="e.g. 4829"
            className="w-full px-4 py-2 pr-10 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white font-mono tracking-widest"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowPin((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentTab({
  editing,
  onFieldChange,
}: {
  editing: Accommodation;
  onFieldChange: (updates: Partial<Accommodation>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (English)</label>
          <textarea
            value={editing.short_description_en}
            onChange={(e) => onFieldChange({ short_description_en: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (Romanian)</label>
          <textarea
            value={editing.short_description_ro}
            onChange={(e) => onFieldChange({ short_description_ro: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Description (English)</label>
          <textarea
            value={editing.description_en}
            onChange={(e) => onFieldChange({ description_en: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Description (Romanian)</label>
          <textarea
            value={editing.description_ro}
            onChange={(e) => onFieldChange({ description_ro: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}

function PricingTab({
  editing,
  onFieldChange,
}: {
  editing: Accommodation;
  onFieldChange: (updates: Partial<Accommodation>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Daily) (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={editing.base_price_per_night}
            onChange={(e) => onFieldChange({ base_price_per_night: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Price (7 nights) (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={editing.price_weekly}
            onChange={(e) => onFieldChange({ price_weekly: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (30 nights) (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={editing.price_monthly}
            onChange={(e) => onFieldChange({ price_monthly: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price (365 nights) (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={editing.price_yearly}
            onChange={(e) => onFieldChange({ price_yearly: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={editing.cleaning_fee}
            onChange={(e) => onFieldChange({ cleaning_fee: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Nights</label>
          <input
            type="number"
            min="1"
            value={editing.minimum_nights}
            onChange={(e) => onFieldChange({ minimum_nights: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Nights</label>
          <input
            type="number"
            min="1"
            value={editing.maximum_nights}
            onChange={(e) => onFieldChange({ maximum_nights: parseInt(e.target.value) || 365 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
          <input
            type="time"
            value={editing.check_in_time}
            onChange={(e) => onFieldChange({ check_in_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
          <input
            type="time"
            value={editing.check_out_time}
            onChange={(e) => onFieldChange({ check_out_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
