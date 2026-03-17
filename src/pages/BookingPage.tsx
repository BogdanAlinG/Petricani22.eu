import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Users,
  Bed,
  Bath,
  CreditCard,
  Loader,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  useAccommodation,
  useAvailability,
  usePriceCalculation,
  createBooking,
} from '../hooks/useAccommodations';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { useSlugContext } from '../contexts/SlugContext';

const content = {
  EN: {
    title: 'Complete Your Booking',
    back: 'Back to accommodation',
    tripDetails: 'Your Trip',
    dates: 'Dates',
    guests: 'Guests',
    guest: 'guest',
    guestPlural: 'guests',
    edit: 'Edit',
    guestInfo: 'Guest Information',
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    specialRequests: 'Special Requests',
    specialRequestsPlaceholder: 'Any special requirements or requests...',
    paymentMethod: 'Payment Method',
    payOnline: 'Pay Online',
    payOnlineDesc: 'Secure payment with credit card',
    payOnArrival: 'Pay on Arrival',
    payOnArrivalDesc: 'Pay when you arrive',
    priceDetails: 'Price Details',
    nights: 'nights',
    cleaningFee: 'Cleaning fee',
    total: 'Total',
    confirmBooking: 'Confirm Booking',
    processing: 'Processing...',
    termsNotice: 'By confirming, you agree to our terms and cancellation policy',
    bookingSuccess: 'Booking Confirmed!',
    bookingSuccessMsg: 'Your booking has been confirmed. Check your email for details.',
    bookingNumber: 'Booking Number',
    viewBooking: 'View Booking Details',
    errorTitle: 'Something went wrong',
    tryAgain: 'Please try again',
    invalidDates: 'Invalid dates selected',
    securePayment: 'Secure Payment',
    securePaymentDesc: 'Your payment information is encrypted and secure',
    minimumStay: 'Minimum stay',
    night: 'night',
  },
  RO: {
    title: 'Finalizați Rezervarea',
    back: 'Înapoi la cazare',
    tripDetails: 'Călătoria Dvs.',
    dates: 'Date',
    guests: 'Oaspeți',
    guest: 'oaspete',
    guestPlural: 'oaspeți',
    edit: 'Editare',
    guestInfo: 'Informații Oaspete',
    name: 'Nume Complet',
    email: 'Adresă de Email',
    phone: 'Număr de Telefon',
    specialRequests: 'Cerințe Speciale',
    specialRequestsPlaceholder: 'Orice cerințe sau solicitări speciale...',
    paymentMethod: 'Metodă de Plată',
    payOnline: 'Plată Online',
    payOnlineDesc: 'Plată securizată cu cardul',
    payOnArrival: 'Plată la Sosire',
    payOnArrivalDesc: 'Plătiți când ajungeți',
    priceDetails: 'Detalii Preț',
    nights: 'nopți',
    cleaningFee: 'Taxa de curățenie',
    total: 'Total',
    confirmBooking: 'Confirmă Rezervarea',
    processing: 'Se procesează...',
    termsNotice: 'Prin confirmare, sunteți de acord cu termenii și politica de anulare',
    bookingSuccess: 'Rezervare Confirmată!',
    bookingSuccessMsg: 'Rezervarea dvs. a fost confirmată. Verificați emailul pentru detalii.',
    bookingNumber: 'Număr Rezervare',
    viewBooking: 'Vezi Detaliile Rezervării',
    errorTitle: 'Ceva nu a mers bine',
    tryAgain: 'Vă rugăm să încercați din nou',
    invalidDates: 'Date selectate invalide',
    securePayment: 'Plată Securizată',
    securePaymentDesc: 'Informațiile dvs. de plată sunt criptate și securizate',
    minimumStay: 'Sejur minim',
    night: 'noapte',
  },
};

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const { getAccommodationPath, getOrderConfirmationPath } = useLocalizedPath();
  const { setCurrentSlugPair } = useSlugContext();
  const t = content[language];

  const { accommodation, loading: accLoading } = useAccommodation(slug || '');
  const { isRangeAvailable } = useAvailability(accommodation?.id || '');

  useEffect(() => {
    if (accommodation) {
      setCurrentSlugPair({ slug: accommodation.slug, slug_ro: accommodation.slug_ro });
    }
    return () => setCurrentSlugPair(null);
  }, [accommodation, setCurrentSlugPair]);

  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  const [checkIn] = useState<Date | null>(checkInParam ? new Date(checkInParam) : null);
  const [checkOut] = useState<Date | null>(checkOutParam ? new Date(checkOutParam) : null);
  const [guests] = useState(parseInt(guestsParam || '1', 10));

  const priceCalculation = usePriceCalculation(accommodation, checkIn, checkOut);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!checkIn || !checkOut) {
      if (accommodation) {
        navigate(getAccommodationPath({ slug: accommodation.slug, slug_ro: accommodation.slug_ro }));
      }
    }
  }, [checkIn, checkOut, accommodation, navigate, getAccommodationPath]);

  const formatPrice = (price: number) => {
    const converted = currency === 'EUR' ? price : Math.round(price * (exchangeRate || 4.95));
    const symbol = currency === 'EUR' ? '€' : 'RON';
    return `${symbol} ${converted.toLocaleString()}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(language === 'EN' ? 'en-US' : 'ro-RO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (language === 'RO') {
      if (target.validity.valueMissing) {
        target.setCustomValidity('Acest câmp este obligatoriu.');
      } else if (target.type === 'email' && target.validity.typeMismatch) {
        target.setCustomValidity('Vă rugăm să introduceți o adresă de email validă.');
      } else if (target.type === 'email' && target.validity.valueMissing === false) {
        target.setCustomValidity('Vă rugăm să includeți un "@" în adresa de email.');
      } else {
        target.setCustomValidity('');
      }
    } else {
      target.setCustomValidity('');
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accommodation || !checkIn || !checkOut || !priceCalculation) return;

    if (!isRangeAvailable(checkIn, checkOut)) {
      setError(t.invalidDates);
      return;
    }

    setSubmitting(true);
    setError('');

    const { data, error: bookingError } = await createBooking({
      accommodation_id: accommodation.id,
      guest_name: formData.name,
      guest_email: formData.email,
      guest_phone: formData.phone || undefined,
      check_in_date: checkIn.toISOString().split('T')[0],
      check_out_date: checkOut.toISOString().split('T')[0],
      num_guests: guests,
      total_nights: priceCalculation.nights,
      subtotal: priceCalculation.subtotal,
      cleaning_fee: priceCalculation.cleaningFee,
      total_amount: priceCalculation.total,
      currency: 'EUR',
      special_requests: formData.specialRequests || undefined,
      payment_method: paymentMethod,
    });

    setSubmitting(false);

    if (bookingError || !data) {
      setError(bookingError || t.errorTitle);
      return;
    }

    if (paymentMethod === 'online') {
      navigate(getOrderConfirmationPath(data.booking_number));
    } else {
      setBookingNumber(data.booking_number);
      setBookingComplete(true);
    }
  };

  if (accLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!accommodation || !checkIn || !checkOut) {
    return null;
  }

  const title = language === 'EN' ? accommodation.title_en : accommodation.title_ro;
  const detailPath = getAccommodationPath({ slug: accommodation.slug, slug_ro: accommodation.slug_ro });

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.bookingSuccess}</h1>
            <p className="text-gray-600 mb-6">{t.bookingSuccessMsg}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">{t.bookingNumber}</div>
              <div className="text-2xl font-bold text-primary">{bookingNumber}</div>
            </div>

            <Link
              to={getOrderConfirmationPath(bookingNumber)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              {t.viewBooking}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          to={detailPath}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          {t.back}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t.tripDetails}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{t.dates}</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(checkIn)} - {formatDate(checkOut)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {priceCalculation?.nights} {t.nights}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{t.guests}</div>
                      <div className="font-medium text-gray-900">
                        {guests} {guests === 1 ? t.guest : t.guestPlural}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t.guestInfo}</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.name} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.email} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onInvalid={handleInvalid}
                        onInput={handleInput}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.phone}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.specialRequests}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.specialRequests}
                      onChange={(e) =>
                        setFormData({ ...formData, specialRequests: e.target.value })
                      }
                      placeholder={t.specialRequestsPlaceholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t.paymentMethod}</h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'online'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="font-medium text-gray-900">{t.payOnline}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{t.payOnlineDesc}</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'arrival'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="arrival"
                      checked={paymentMethod === 'arrival'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{t.payOnArrival}</div>
                      <p className="text-sm text-gray-500 mt-1">{t.payOnArrivalDesc}</p>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'online' && (
                  <div className="mt-6 flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">{t.securePayment}</div>
                      <p className="text-sm text-green-700">{t.securePaymentDesc}</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{t.errorTitle}</div>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !formData.name || !formData.email}
                className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t.confirmBooking}
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">{t.termsNotice}</p>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-video">
                <img
                  src={
                    accommodation.thumbnail_url ||
                    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'
                  }
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {accommodation.beds}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {accommodation.bathrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {accommodation.max_guests}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">{t.priceDetails}</h4>

                  {priceCalculation && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {formatPrice(priceCalculation.pricePerNight)} x{' '}
                          {priceCalculation.nights} {t.nights}
                        </span>
                        <span className="text-gray-900">
                          {formatPrice(priceCalculation.subtotal)}
                        </span>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
