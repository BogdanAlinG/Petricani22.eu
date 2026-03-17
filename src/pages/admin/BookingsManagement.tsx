import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  CreditCard,
  User,
  Mail,
  Phone,
  MessageSquare,
  X,
  Loader,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import type { Booking, Accommodation } from '../../types/accommodation';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

interface BookingWithAccommodation extends Booking {
  accommodation: Accommodation;
}

export default function BookingsManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const [bookings, setBookings] = useState<BookingWithAccommodation[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithAccommodation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accommodationFilter, setAccommodationFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, accRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            accommodation:accommodations(*)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('accommodations').select('*').order('title_en'),
      ]);

      setBookings((bookingsRes.data || []) as BookingWithAccommodation[]);
      setAccommodations(accRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const updates: Record<string, unknown> = {
        booking_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'checked_in') {
        updates.checked_in_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.checked_out_at = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId);

      if (error) throw error;

      setBookings(
        bookings.map((b) => (b.id === bookingId ? { ...b, ...updates } as BookingWithAccommodation : b))
      );

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, ...updates } as BookingWithAccommodation);
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      toast.error('Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleDeleteBooking = async (bookingId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    setUpdating(true);
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;

      setBookings(bookings.filter((b) => b.id !== bookingId));
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
      }
      toast.success('Booking deleted successfully');
    } catch (err) {
      console.error('Error deleting booking:', err);
      toast.error('Failed to delete booking');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      searchTerm === '' ||
      booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;

    const matchesAccommodation =
      accommodationFilter === 'all' || booking.accommodation_id === accommodationFilter;

    return matchesSearch && matchesStatus && matchesAccommodation;
  });

  const exportToCSV = () => {
    const headers = [
      'Booking Number',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Accommodation',
      'Check-in',
      'Check-out',
      'Guests',
      'Total',
      'Status',
      'Payment Status',
      'Created',
    ];

    const rows = filteredBookings.map((b) => [
      b.booking_number,
      b.guest_name,
      b.guest_email,
      b.guest_phone || '',
      b.accommodation?.title_en || '',
      b.check_in_date,
      b.check_out_date,
      b.num_guests,
      `${b.total_amount} ${b.currency}`,
      b.booking_status,
      b.payment_status,
      formatDateTime(b.created_at),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage reservations and guest bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking number, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={accommodationFilter}
              onChange={(e) => setAccommodationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Accommodations</option>
              {accommodations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.title_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Booking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Accommodation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dates
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-mono font-medium text-gray-900">
                        {booking.booking_number}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(booking.created_at)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{booking.guest_name}</div>
                      <div className="text-sm text-gray-500">{booking.guest_email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-900">{booking.accommodation?.title_en}</div>
                      <div className="text-sm text-gray-500">
                        {booking.num_guests} guest{booking.num_guests > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-900">
                        {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                      </div>
                      <div className="text-sm text-gray-500">{booking.total_nights} nights</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {booking.currency} {booking.total_amount}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          PAYMENT_STATUS_COLORS[booking.payment_status]
                        }`}
                      >
                        {booking.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[booking.booking_status]
                        }`}
                      >
                        {booking.booking_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">Booking Details</h2>
                <p className="text-sm text-gray-500">{selectedBooking.booking_number}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[selectedBooking.booking_status]
                  }`}
                >
                  {selectedBooking.booking_status.replace('_', ' ')}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    PAYMENT_STATUS_COLORS[selectedBooking.payment_status]
                  }`}
                >
                  Payment: {selectedBooking.payment_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Guest Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{selectedBooking.guest_name}</p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" /> {selectedBooking.guest_email}
                    </p>
                    {selectedBooking.guest_phone && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" /> {selectedBooking.guest_phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Stay Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Check-in:</span>{' '}
                      {formatDate(selectedBooking.check_in_date)}
                    </p>
                    <p>
                      <span className="text-gray-500">Check-out:</span>{' '}
                      {formatDate(selectedBooking.check_out_date)}
                    </p>
                    <p>
                      <span className="text-gray-500">Nights:</span>{' '}
                      {selectedBooking.total_nights}
                    </p>
                    <p>
                      <span className="text-gray-500">Guests:</span> {selectedBooking.num_guests}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      {selectedBooking.currency} {selectedBooking.subtotal}
                    </span>
                  </div>
                  {selectedBooking.cleaning_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Cleaning Fee</span>
                      <span>
                        {selectedBooking.currency} {selectedBooking.cleaning_fee}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>
                      {selectedBooking.currency} {selectedBooking.total_amount}
                    </span>
                  </div>
                  <div className="pt-2 text-gray-500">
                    Method: {selectedBooking.payment_method}
                    {selectedBooking.stripe_payment_intent_id && (
                      <span className="block text-xs">
                        Stripe ID: {selectedBooking.stripe_payment_intent_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedBooking.special_requests && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Special Requests
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                    {selectedBooking.special_requests}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.booking_status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedBooking.booking_status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'checked_in')}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Check In
                      </button>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedBooking.booking_status === 'checked_in' && (
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete / Check Out
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBooking(selectedBooking.id)}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Booking
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t">
                <p>Created: {formatDateTime(selectedBooking.created_at)}</p>
                <p>Source: {selectedBooking.source}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
