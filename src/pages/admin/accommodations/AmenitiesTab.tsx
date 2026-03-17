import type { Amenity, AmenityCategory } from '../../../types/accommodation';

interface AmenitiesTabProps {
  amenityCategories: AmenityCategory[];
  amenities: Amenity[];
  selectedAmenities: string[];
  onToggle: (amenityId: string) => void;
}

export default function AmenitiesTab({
  amenityCategories,
  amenities,
  selectedAmenities,
  onToggle,
}: AmenitiesTabProps) {
  return (
    <div className="space-y-6">
      {amenityCategories.map((category) => {
        const categoryAmenities = amenities.filter((a) => a.category_id === category.id);
        if (categoryAmenities.length === 0) return null;

        return (
          <div key={category.id}>
            <h3 className="font-semibold text-gray-900 mb-3">{category.name_en}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryAmenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAmenities.includes(amenity.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.id)}
                    onChange={() => onToggle(amenity.id)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{amenity.name_en}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
