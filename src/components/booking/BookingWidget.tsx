import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star, Loader } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAvailability, usePriceCalculation, calculateMinPricePerNight } from '../../hooks/useAccommodations';
import { useLocalizedPath } from '../../hooks/useLocalizedPath';
import type { Accommodation } from '../../types/accommodation';
import DateRangePicker from './DateRangePicker';
import GuestSelector from './GuestSelector';

interface BookingWidgetProps {
  accommodation: Accommodation;
}

const content = {
  EN: {
    from: 'From',
    perNight: '/night',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    addDates: 'Add dates',
    guests: 'Guests',
    reserve: 'Reserve',
    checkAvailability: 'Check Availability',
    priceBreakdown: 'Price Breakdown',
    nights: 'nights',
    subtotal: 'Subtotal',
    cleaningFee: 'Cleaning fee',
    total: 'Total',
    selectDates: 'Select dates to see price',
    minimumStay: 'Minimum stay',
    night: 'night',
  },
  RO: {
    from: 'De la',
    perNight: '/noapte',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    addDates: 'Adaugă date',
    guests: 'Oaspeți',
    reserve: 'Rezervă',
    checkAvailability: 'Verifică Disponibilitatea',
    priceBreakdown: 'Detalii Preț',
    nights: 'nopți',
    subtotal: 'Subtotal',
    cleaningFee: 'Taxa de curățenie',
    total: 'Total',
    selectDates: 'Selectați datele pentru a vedea prețul',
    minimumStay: 'Sejur minim',
    night: 'noapte',
  },
};

export default function BookingWidget({ accommodation }: BookingWidgetProps) {
  const { language } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const { getBookingPath } = useLocalizedPath();
  const navigate = useNavigate();
  const t = content[language];

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);

  const { isDateBlocked, loading: availabilityLoading } = useAvailability(accommodation.id);
  const priceCalculation = usePriceCalculation(accommodation, checkIn, checkOut);

  const formatPrice = (price: number) => {
    const converted = currency === 'EUR' ? price : Math.round(price * (exchangeRate || 4.95));
    const symbol = currency === 'EUR' ? '€' : 'RON';
    return `${symbol} ${converted.toLocaleString()}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return t.addDates;
    return date.toLocaleDateString(language === 'EN' ? 'en-US' : 'ro-RO', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleReserve = () => {
    if (!checkIn || !checkOut) {
      setShowCalendar(true);
      return;
    }

    const params = new URLSearchParams({
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: guests.toString(),
    });

    const bookingPath = getBookingPath({ slug: accommodation.slug, slug_ro: accommodation.slug_ro });
    navigate(`${bookingPath}?${params}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-gray-500">{t.from}</span>
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(calculateMinPricePerNight(accommodation))}
          </span>
          <span className="text-gray-500">{t.perNight}</span>
        </div>
        {accommodation.minimum_nights > 1 && (
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <Star className="w-4 h-4" />
            {t.minimumStay}: {accommodation.minimum_nights}{' '}
            {accommodation.minimum_nights === 1 ? t.night : t.nights}
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 border border-gray-300 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-3 text-left border-r border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t.checkIn}
            </div>
            <div className="text-sm text-gray-900 mt-1">{formatDate(checkIn)}</div>
          </button>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t.checkOut}
            </div>
            <div className="text-sm text-gray-900 mt-1">{formatDate(checkOut)}</div>
          </button>
        </div>

        {showCalendar && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            {availabilityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={(date) => {
                  setCheckOut(date);
                  if (date) setShowCalendar(false);
                }}
                isDateBlocked={isDateBlocked}
                minimumNights={accommodation.minimum_nights}
                maximumNights={accommodation.maximum_nights}
              />
            )}
          </div>
        )}

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t.guests}
          </div>
          <GuestSelector
            guests={guests}
            onGuestsChange={setGuests}
            maxGuests={accommodation.max_guests}
          />
        </div>

        <button
          onClick={handleReserve}
          className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          {checkIn && checkOut ? t.reserve : t.checkAvailability}
        </button>

        {priceCalculation && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="font-semibold text-gray-900">{t.priceBreakdown}</div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {formatPrice(priceCalculation.pricePerNight)} x {priceCalculation.nights}{' '}
                {t.nights}
              </span>
              <span className="text-gray-900">{formatPrice(priceCalculation.subtotal)}</span>
            </div>

            {priceCalculation.cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.cleaningFee}</span>
                <span className="text-gray-900">
                  {formatPrice(priceCalculation.cleaningFee)}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-900">{t.total}</span>
              <span className="font-bold text-xl text-gray-900">
                {formatPrice(priceCalculation.total)}
              </span>
            </div>
          </div>
        )}

        {!priceCalculation && (
          <p className="text-center text-sm text-gray-500">{t.selectDates}</p>
        )}
      </div>
    </div>
  );
}
