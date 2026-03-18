import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  Users,
  MapPin,
  Clock,
  Mail,
  Phone,
  Download,
  Home,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getBookingByNumber } from '../hooks/useAccommodations';
import type { Booking } from '../types/accommodation';

const content = {
  EN: {
    title: 'Booking Confirmed',
    subtitle: 'Your reservation has been confirmed. Check your email for details.',
    bookingNumber: 'Booking Number',
    status: 'Status',
    accommodationDetails: 'Rental Details',
    tripDetails: 'Trip Details',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    guest: 'guest',
    guestPlural: 'guests',
    guestDetails: 'Guest Details',
    paymentDetails: 'Payment Details',
    subtotal: 'Subtotal',
    cleaningFee: 'Cleaning fee',
    total: 'Total',
    paymentStatus: 'Payment Status',
    paymentMethod: 'Payment Method',
    specialRequests: 'Special Requests',
    downloadConfirmation: 'Download Confirmation',
    addToCalendar: 'Add to Calendar',
    backToHome: 'Back to Home',
    notFound: 'Booking not found',
    notFoundDesc: 'We could not find a booking with this number',
    statusLabels: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      checked_in: 'Checked In',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    paymentStatusLabels: {
      pending: 'Pending',
      paid: 'Paid',
      refunded: 'Refunded',
      failed: 'Failed',
    },
    paymentMethodLabels: {
      online: 'Online Payment',
      arrival: 'Pay on Arrival',
      stripe: 'Credit Card',
    },
    nights: 'nights',
  },
  RO: {
    title: 'Rezervare Confirmată',
    subtitle: 'Rezervarea dvs. a fost confirmată. Verificați emailul pentru detalii.',
    bookingNumber: 'Număr Rezervare',
    status: 'Status',
    accommodationDetails: 'Detalii Unitate',
    tripDetails: 'Detalii Călătorie',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Oaspeți',
    guest: 'oaspete',
    guestPlural: 'oaspeți',
    guestDetails: 'Detalii Oaspete',
    paymentDetails: 'Detalii Plată',
    subtotal: 'Subtotal',
    cleaningFee: 'Taxa de curățenie',
    total: 'Total',
    paymentStatus: 'Status Plată',
    paymentMethod: 'Metodă de Plată',
    specialRequests: 'Cerințe Speciale',
    downloadConfirmation: 'Descarcă Confirmarea',
    addToCalendar: 'Adaugă în Calendar',
    backToHome: 'Înapoi la Pagina Principală',
    notFound: 'Rezervare negăsită',
    notFoundDesc: 'Nu am putut găsi o rezervare cu acest număr',
    statusLabels: {
      pending: 'În așteptare',
      confirmed: 'Confirmată',
      checked_in: 'Check-in efectuat',
      completed: 'Finalizată',
      cancelled: 'Anulată',
    },
    paymentStatusLabels: {
      pending: 'În așteptare',
      paid: 'Plătită',
      refunded: 'Rambursată',
      failed: 'Eșuată',
    },
    paymentMethodLabels: {
      online: 'Plată Online',
      arrival: 'Plată la Sosire',
      stripe: 'Card de Credit',
    },
    nights: 'nopți',
  },
};

export default function BookingConfirmationPage() {
  const { bookingNumber } = useParams<{ bookingNumber: string }>();
  const { language } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const t = content[language];

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingNumber) return;

      const { data, error: fetchError } = await getBookingByNumber(bookingNumber);
      setLoading(false);

      if (fetchError || !data) {
        setError(true);
        return;
      }

      setBooking(data);
    }

    fetchBooking();
  }, [bookingNumber]);

  const formatPrice = (price: number) => {
    const converted = currency === 'EUR' ? price : Math.round(price * (exchangeRate || 4.95));
    const symbol = currency === 'EUR' ? '€' : 'RON';
    return `${symbol} ${converted.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'EN' ? 'en-US' : 'ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'checked_in':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const homePath = language === 'EN' ? '/en' : '/ro';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.notFound}</h1>
          <p className="text-gray-600 mb-6">{t.notFoundDesc}</p>
          <Link
            to={homePath}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            <Home className="w-5 h-5" />
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  const accommodation = booking.accommodation;
  const title = accommodation
    ? language === 'EN'
      ? accommodation.title_en
      : accommodation.title_ro
    : '';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-green-100">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6">
              <div>
                <div className="text-sm text-green-100">{t.bookingNumber}</div>
                <div className="text-2xl font-bold">{booking.booking_number}</div>
              </div>
              <div>
                <div className="text-sm text-green-100">{t.status}</div>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    booking.booking_status
                  )}`}
                >
                  {t.statusLabels[booking.booking_status as keyof typeof t.statusLabels]}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {accommodation && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {t.accommodationDetails}
                </h2>
                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={
                      accommodation.thumbnail_url ||
                      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200'
                    }
                    alt={title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {accommodation.beds}{' '}
                      {language === 'EN' ? 'beds' : 'paturi'} ·{' '}
                      {accommodation.bathrooms}{' '}
                      {language === 'EN' ? 'baths' : 'băi'} ·{' '}
                      {accommodation.max_guests}{' '}
                      {language === 'EN' ? 'guests' : 'oaspeți'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.tripDetails}</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">{t.checkIn}</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(booking.check_in_date)}
                      </div>
                      {accommodation && (
                        <div className="text-sm text-gray-500">
                          {accommodation.check_in_time}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">{t.checkOut}</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(booking.check_out_date)}
                      </div>
                      {accommodation && (
                        <div className="text-sm text-gray-500">
                          {accommodation.check_out_time}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">{t.guests}</div>
                      <div className="font-medium text-gray-900">
                        {booking.num_guests}{' '}
                        {booking.num_guests === 1 ? t.guest : t.guestPlural}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.guestDetails}</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{booking.guest_name}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{booking.guest_email}</div>
                    </div>
                  </div>
                  {booking.guest_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{booking.guest_phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {booking.special_requests && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.specialRequests}</h2>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">
                  {booking.special_requests}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t.paymentDetails}</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {formatPrice(
                        booking.subtotal / booking.total_nights
                      )} x {booking.total_nights} {t.nights}
                    </span>
                    <span className="text-gray-900">{formatPrice(booking.subtotal)}</span>
                  </div>
                  {booking.cleaning_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.cleaningFee}</span>
                      <span className="text-gray-900">
                        {formatPrice(booking.cleaning_fee)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">{t.total}</span>
                    <span className="font-bold text-xl text-gray-900">
                      {formatPrice(booking.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">{t.paymentMethod}</div>
                    <div className="font-medium text-gray-900">
                      {t.paymentMethodLabels[
                        booking.payment_method as keyof typeof t.paymentMethodLabels
                      ] || booking.payment_method}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t.paymentStatus}</div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        booking.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {t.paymentStatusLabels[
                        booking.payment_status as keyof typeof t.paymentStatusLabels
                      ]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
              <Link
                to={homePath}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                <Home className="w-5 h-5" />
                {t.backToHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
