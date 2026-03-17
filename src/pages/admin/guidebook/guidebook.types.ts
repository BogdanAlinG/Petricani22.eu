export interface GuidebookCategory {
  id: string;
  accommodation_id: string | null;
  title_en: string;
  title_ro: string;
  icon: string;
  display_order: number;
  requires_pin: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuidebookItem {
  id: string;
  category_id: string;
  accommodation_id: string | null;
  title_en: string;
  title_ro: string;
  content_en: string;
  content_ro: string;
  image_url: string | null;
  display_order: number;
  requires_pin: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuidebookAccommodation {
  id: string;
  title_en: string;
  title_ro: string;
  slug: string;
}

export const AVAILABLE_ICONS = [
  { value: 'DoorOpen', label: 'Door' },
  { value: 'Wifi', label: 'Wi-Fi' },
  { value: 'ScrollText', label: 'Rules' },
  { value: 'ParkingSquare', label: 'Parking' },
  { value: 'MapPin', label: 'Location' },
  { value: 'Utensils', label: 'Food' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Tv', label: 'TV' },
  { value: 'Thermometer', label: 'Temperature' },
  { value: 'Key', label: 'Key' },
  { value: 'Car', label: 'Car' },
  { value: 'Bus', label: 'Transport' },
  { value: 'ShoppingBag', label: 'Shopping' },
  { value: 'Phone', label: 'Phone' },
  { value: 'AlertCircle', label: 'Alert' },
  { value: 'Trash2', label: 'Waste' },
  { value: 'Droplets', label: 'Water' },
  { value: 'Zap', label: 'Electricity' },
  { value: 'BookOpen', label: 'Guide' },
  { value: 'Info', label: 'Info' },
  { value: 'Star', label: 'Highlights' },
  { value: 'Heart', label: 'Favorites' },
  { value: 'Clock', label: 'Schedule' },
  { value: 'Lock', label: 'Security' },
  { value: 'Camera', label: 'Camera' },
  { value: 'Music', label: 'Music' },
  { value: 'Flower2', label: 'Garden' },
  { value: 'Flame', label: 'Fire/Grill' },
  { value: 'Waves', label: 'Pool' },
  { value: 'TreePine', label: 'Nature' },
];
