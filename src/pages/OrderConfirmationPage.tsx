import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Calendar, Clock, CreditCard, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePrice } from '../hooks/usePrice';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';

interface Order {
  order_number: string;
  guest_name: string;
  guest_email: string;
  room_number: string;
  delivery_date: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  order_status: string;
  delivery_time_slot_id: string | null;
}

interface OrderItem {
  quantity: number;
  unit_price: number;
  products: {
    title_en: string;
    title_ro: string;
  };
  product_sizes: {
    size_name_en: string;
    size_name_ro: string;
  } | null;
}

interface TimeSlot {
  slot_name_en: string;
  slot_name_ro: string;
  start_time: string;
  end_time: string;
}

export default function OrderConfirmationPage() {
  const { language } = useLanguage();
  const { menuPath } = useLocalizedPath();
  const { orderNumber } = useParams();
  const { formatPrice } = usePrice();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (orderData) {
        setOrder(orderData);

        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            *,
            products (title_en, title_ro),
            product_sizes (size_name_en, size_name_ro)
          `)
          .eq('order_id', orderData.id);

        if (itemsData) {
          setOrderItems(itemsData);
        }

        if (orderData.delivery_time_slot_id) {
          const { data: slotData } = await supabase
            .from('delivery_time_slots')
            .select('*')
            .eq('id', orderData.delivery_time_slot_id)
            .maybeSingle();

          if (slotData) {
            setTimeSlot(slotData);
          }
        }
      }

      setLoading(false);
    }
    fetchOrder();
  }, [orderNumber]);

  const content = {
    RO: {
      success: 'Comanda Plasata cu Succes!',
      pendingTitle: 'Comanda in Asteptare',
      orderNumber: 'Numar Comanda',
      thankYou: 'Va multumim pentru comanda!',
      cashMessage: 'Comanda dvs. va fi confirmata dupa primirea platii in numerar la livrare.',
      onlineMessage: 'Comanda dvs. a fost confirmata si va fi livrata la data selectata.',
      orderDetails: 'Detalii Comanda',
      deliveryDate: 'Data Livrare',
      timeSlot: 'Interval Orar',
      room: 'Camera',
      paymentMethod: 'Metoda de Plata',
      cash: 'Numerar',
      online: 'Online',
      paymentStatus: 'Status Plata',
      pending: 'In asteptare',
      paid: 'Platit',
      items: 'Produse Comandate',
      total: 'Total',
      backToMenu: 'Inapoi la Meniu',
      orderConfirmation: 'Confirmarea comenzii a fost trimisa pe email la',
      notFound: 'Comanda negasita',
    },
    EN: {
      success: 'Order Placed Successfully!',
      pendingTitle: 'Order Pending',
      orderNumber: 'Order Number',
      thankYou: 'Thank you for your order!',
      cashMessage: 'Your order will be confirmed once cash payment is received upon delivery.',
      onlineMessage: 'Your order has been confirmed and will be delivered on the selected date.',
      orderDetails: 'Order Details',
      deliveryDate: 'Delivery Date',
      timeSlot: 'Time Slot',
      room: 'Room',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      online: 'Online',
      paymentStatus: 'Payment Status',
      pending: 'Pending',
      paid: 'Paid',
      items: 'Ordered Items',
      total: 'Total',
      backToMenu: 'Back to Menu',
      orderConfirmation: 'Order confirmation has been sent to',
      notFound: 'Order not found',
    },
  };

  const t = content[language];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.notFound}</h2>
          <Link to={menuPath} className="text-amber-600 hover:underline">
            {t.backToMenu}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';
  const isCash = order.payment_method === 'cash';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div
            className={`p-8 text-center ${
              isPaid ? 'bg-green-50' : 'bg-amber-50'
            }`}
          >
            {isPaid ? (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            ) : (
              <AlertCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isPaid ? t.success : t.pendingTitle}
            </h1>
            <p className="text-lg text-gray-700 mb-4">{t.thankYou}</p>
            <div className="inline-block bg-white px-6 py-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">{t.orderNumber}</div>
              <div className="text-2xl font-bold text-gray-900">{order.order_number}</div>
            </div>
          </div>

          <div className="p-8">
            <div
              className={`mb-6 p-4 rounded-lg border ${
                isCash
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <p className={isCash ? 'text-amber-800' : 'text-green-800'}>
                {isCash ? t.cashMessage : t.onlineMessage}
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">{t.orderDetails}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  {t.deliveryDate}
                </div>
                <div className="font-semibold text-gray-900">
                  {new Date(order.delivery_date).toLocaleDateString()}
                </div>
              </div>

              {timeSlot && (
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    {t.timeSlot}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {language === 'RO' ? timeSlot.slot_name_ro : timeSlot.slot_name_en} (
                    {timeSlot.start_time.slice(0, 5)} - {timeSlot.end_time.slice(0, 5)})
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">{t.room}</div>
                <div className="font-semibold text-gray-900">{order.room_number}</div>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  {isCash ? (
                    <Banknote className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {t.paymentMethod}
                </div>
                <div className="font-semibold text-gray-900">
                  {isCash ? t.cash : t.online}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">{t.paymentStatus}</div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPaid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isPaid ? t.paid : t.pending}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3">{t.items}</h3>
            <div className="space-y-2 mb-6">
              {orderItems.map((item, index) => {
                const productTitle =
                  language === 'RO'
                    ? item.products.title_ro
                    : item.products.title_en;
                const sizeName = item.product_sizes
                  ? language === 'RO'
                    ? item.product_sizes.size_name_ro
                    : item.product_sizes.size_name_en
                  : null;

                return (
                  <div key={index} className="flex justify-between py-2">
                    <div>
                      <span className="text-gray-900">
                        {item.quantity}x {productTitle}
                      </span>
                      {sizeName && (
                        <span className="text-gray-600 text-sm ml-2">({sizeName})</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {formatPrice(item.unit_price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>{t.total}</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              {t.orderConfirmation} <strong>{order.guest_email}</strong>
            </div>

            <Link
              to={menuPath}
              className="block w-full bg-amber-600 text-white text-center px-8 py-4 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              {t.backToMenu}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
