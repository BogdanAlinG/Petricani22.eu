import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Accommodation,
  AccommodationImage,
  Amenity,
  AmenityCategory,
  HouseRule,
  PointOfInterest,
  Booking,
  BlockedDate,
  ICalEvent,
  PriceCalculation,
  PricingRule,
  UnitType,
} from '../types/accommodation';

export function useAccommodations() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [accRes, typeRes] = await Promise.all([
        supabase
          .from('accommodations')
          .select('*')
          .eq('is_visible', true)
          .order('display_order'),
        supabase
          .from('unit_types')
          .select('*')
          .order('display_order')
      ]);

      if (accRes.error) throw accRes.error;
      if (typeRes.error) throw typeRes.error;

      setAccommodations(accRes.data || []);
      setUnitTypes(typeRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { accommodations, unitTypes, loading, error, refetch: fetchData };
}

export function useAccommodation(slug: string) {
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [images, setImages] = useState<AccommodationImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccommodation() {
      if (!slug) return;

      try {
        setLoading(true);

        const { data: accData, error: accError } = await supabase
          .from('accommodations')
          .select('*')
          .or(`slug.eq.${slug},slug_ro.eq.${slug}`)
          .eq('is_visible', true)
          .maybeSingle();

        if (accError) throw accError;
        if (!accData) {
          setError('Space not found');
          return;
        }

        const { data: imgData } = await supabase
          .from('accommodation_images')
          .select('*')
          .eq('accommodation_id', accData.id)
          .order('display_order');

        const { data: amenityLinks } = await supabase
          .from('accommodation_amenities')
          .select(`
            *,
            amenity:amenities(
              *,
              category:amenity_categories(*)
            )
          `)
          .eq('accommodation_id', accData.id);

        setAccommodation({
          ...accData,
          amenities: amenityLinks || [],
        });
        setImages(imgData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching accommodation:', err);
        setError('Failed to load rental details');
      } finally {
        setLoading(false);
      }
    }

    fetchAccommodation();
  }, [slug]);

  return { accommodation, images, loading, error };
}

export function useAmenities() {
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAmenities() {
      try {
        const [catRes, amenRes] = await Promise.all([
          supabase.from('amenity_categories').select('*').order('display_order'),
          supabase.from('amenities').select('*').order('display_order'),
        ]);

        setCategories(catRes.data || []);
        setAmenities(amenRes.data || []);
      } catch (err) {
        console.error('Error fetching amenities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAmenities();
  }, []);

  return { categories, amenities, loading };
}

export function useHouseRules() {
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      try {
        const { data } = await supabase
          .from('house_rules')
          .select('*')
          .eq('is_visible', true)
          .order('display_order');

        setRules(data || []);
      } catch (err) {
        console.error('Error fetching house rules:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRules();
  }, []);

  return { rules, loading };
}

export function usePointsOfInterest() {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPois() {
      try {
        const { data } = await supabase
          .from('points_of_interest')
          .select('*')
          .eq('is_visible', true)
          .order('display_order');

        setPois(data || []);
      } catch (err) {
        console.error('Error fetching points of interest:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPois();
  }, []);

  return { pois, loading };
}

export function useAvailability(accommodationId: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [icalEvents, setIcalEvents] = useState<ICalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailability() {
      if (!accommodationId) return;

      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const [bookingsRes, blockedRes, icalRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .eq('accommodation_id', accommodationId)
            .neq('booking_status', 'cancelled')
            .gte('check_out_date', today),
          supabase
            .from('blocked_dates')
            .select('*')
            .eq('accommodation_id', accommodationId)
            .gte('end_date', today),
          supabase
            .from('ical_events')
            .select(`
              *,
              ical_feed:ical_feeds!inner(accommodation_id, is_active)
            `)
            .eq('ical_feed.accommodation_id', accommodationId)
            .eq('ical_feed.is_active', true)
            .gte('end_date', today),
        ]);

        setBookings(bookingsRes.data || []);
        setBlockedDates(blockedRes.data || []);
        setIcalEvents(icalRes.data || []);
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [accommodationId]);

  const isDateBlocked = useCallback(
    (date: Date): boolean => {
      const dateStr = date.toISOString().split('T')[0];

      const hasBooking = bookings.some(
        (b) => dateStr >= b.check_in_date && dateStr < b.check_out_date
      );
      if (hasBooking) return true;

      const hasBlock = blockedDates.some(
        (b) => dateStr >= b.start_date && dateStr <= b.end_date
      );
      if (hasBlock) return true;

      const hasIcalEvent = icalEvents.some(
        (e) => dateStr >= e.start_date && dateStr < e.end_date
      );
      if (hasIcalEvent) return true;

      return false;
    },
    [bookings, blockedDates, icalEvents]
  );

  const isRangeAvailable = useCallback(
    (checkIn: Date, checkOut: Date): boolean => {
      const current = new Date(checkIn);
      while (current < checkOut) {
        if (isDateBlocked(current)) return false;
        current.setDate(current.getDate() + 1);
      }
      return true;
    },
    [isDateBlocked]
  );

  return { bookings, blockedDates, icalEvents, loading, isDateBlocked, isRangeAvailable };
}

export function usePriceCalculation(
  accommodation: Accommodation | null,
  checkIn: Date | null,
  checkOut: Date | null
) {
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  useEffect(() => {
    async function fetchPricingRules() {
      if (!accommodation) return;

      const { data } = await supabase
        .from('pricing_rules')
        .select('*')
        .or(`accommodation_id.eq.${accommodation.id},accommodation_id.is.null`)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      setPricingRules(data || []);
    }

    fetchPricingRules();
  }, [accommodation]);

  useEffect(() => {
    if (!accommodation || !checkIn || !checkOut) {
      setCalculation(null);
      return;
    }

    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      setCalculation(null);
      return;
    }

    // Determine the base daily rate based on tiered pricing durations
    let baseDailyRate = accommodation.base_price_per_night;
    
    if (nights >= 365 && accommodation.price_yearly > 0) {
      baseDailyRate = accommodation.price_yearly / 365;
    } else if (nights >= 30 && accommodation.price_monthly > 0) {
      baseDailyRate = accommodation.price_monthly / 30;
    } else if (nights >= 7 && accommodation.price_weekly > 0) {
      baseDailyRate = accommodation.price_weekly / 7;
    }

    let totalPrice = 0;
    const current = new Date(checkIn);

    while (current < checkOut) {
      const dateStr = current.toISOString().split('T')[0];
      let dayPrice = baseDailyRate;

      const applicableRule = pricingRules.find(
        (rule) => dateStr >= rule.start_date && dateStr <= rule.end_date
      );

      if (applicableRule) {
        switch (applicableRule.price_modifier_type) {
          case 'percentage':
            dayPrice = dayPrice * (1 + applicableRule.price_modifier_value / 100);
            break;
          case 'fixed':
            dayPrice = dayPrice + applicableRule.price_modifier_value;
            break;
          case 'override':
            dayPrice = applicableRule.price_modifier_value;
            break;
        }
      }

      totalPrice += dayPrice;
      current.setDate(current.getDate() + 1);
    }

    const subtotal = totalPrice;
    const cleaningFee = accommodation.cleaning_fee || 0;
    const total = subtotal + cleaningFee;

    setCalculation({
      basePrice: accommodation.base_price_per_night,
      nights,
      subtotal,
      cleaningFee,
      total,
      currency: 'EUR',
      pricePerNight: subtotal / nights,
    });
  }, [accommodation, checkIn, checkOut, pricingRules]);

  return calculation;
}

export async function createBooking(bookingData: {
  accommodation_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_nights: number;
  subtotal: number;
  cleaning_fee: number;
  total_amount: number;
  currency?: string;
  special_requests?: string;
  payment_method?: string;
}): Promise<{ data: Booking | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        booking_number: '',
        booking_status: 'pending',
        payment_status: 'pending',
        source: 'direct',
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error creating booking:', err);
    return { data: null, error: 'Failed to create booking' };
  }
}

export async function getBookingByNumber(
  bookingNumber: string
): Promise<{ data: Booking | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        accommodation:accommodations(*)
      `)
      .eq('booking_number', bookingNumber)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error fetching booking:', err);
    return { data: null, error: 'Failed to fetch booking' };
  }
}

export function calculateMinPricePerNight(accommodation: Accommodation): number {
  const rates = [accommodation.base_price_per_night];
  if (accommodation.price_weekly > 0) rates.push(accommodation.price_weekly / 7);
  if (accommodation.price_monthly > 0) rates.push(accommodation.price_monthly / 30);
  if (accommodation.price_yearly > 0) rates.push(accommodation.price_yearly / 365);
  return Math.round(Math.min(...rates));
}
