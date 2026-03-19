export interface Accommodation {
  id: string;
  slug: string;
  slug_ro: string;
  title_en: string;
  title_ro: string;
  short_description_en: string;
  short_description_ro: string;
  description_en: string;
  description_ro: string;
  unit_type: string;
  beds: number;
  bathrooms: number;
  max_guests: number;
  sqm: number | null;
  base_price_per_night: number;
  price_weekly: number;
  price_monthly: number;
  price_yearly: number;
  cleaning_fee: number;
  minimum_nights: number;
  maximum_nights: number;
  check_in_time: string;
  check_out_time: string;
  thumbnail_url: string | null;
  display_order: number;
  is_visible: boolean;
  is_featured: boolean;
  show_house_rules: boolean;
  guidebook_pin: string | null;
  created_at: string;
  updated_at: string;
  images?: AccommodationImage[];
  amenities?: AccommodationAmenityWithDetails[];
}

export interface AccommodationImage {
  id: string;
  accommodation_id: string;
  image_url: string;
  alt_text_en: string;
  alt_text_ro: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface AmenityCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ro: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export interface Amenity {
  id: string;
  category_id: string | null;
  slug: string;
  name_en: string;
  name_ro: string;
  icon: string;
  display_order: number;
  created_at: string;
  category?: AmenityCategory;
}

export interface AccommodationAmenity {
  id: string;
  accommodation_id: string;
  amenity_id: string;
  notes: string | null;
  created_at: string;
}

export interface AccommodationAmenityWithDetails extends AccommodationAmenity {
  amenity: Amenity;
}

export interface HouseRule {
  id: string;
  slug: string;
  title_en: string;
  title_ro: string;
  description_en: string;
  description_ro: string;
  icon: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PointOfInterest {
  id: string;
  name_en: string;
  name_ro: string;
  category: string;
  distance_text: string | null;
  travel_time: string | null;
  google_maps_url: string | null;
  icon: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  accommodation_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_nights: number;
  subtotal: number;
  cleaning_fee: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  special_requests: string | null;
  source: string;
  external_booking_id: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
  accommodation?: Accommodation;
}

export interface BlockedDate {
  id: string;
  accommodation_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ICalFeed {
  id: string;
  accommodation_id: string;
  platform: 'airbnb' | 'booking' | 'vrbo' | 'other';
  feed_name: string;
  feed_url: string;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  sync_interval_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ICalEvent {
  id: string;
  ical_feed_id: string;
  uid: string;
  start_date: string;
  end_date: string;
  summary: string | null;
  description: string | null;
  source_platform: string | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string;
}

export interface PricingRule {
  id: string;
  accommodation_id: string | null;
  rule_name: string;
  start_date: string;
  end_date: string;
  price_modifier_type: 'percentage' | 'fixed' | 'override';
  price_modifier_value: number;
  minimum_nights_override: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingFormData {
  accommodationId: string;
  checkIn: Date;
  checkOut: Date;
  numGuests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
}

export interface PriceCalculation {
  basePrice: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  total: number;
  currency: string;
  pricePerNight: number;
}
