import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { usePrice } from '../hooks/usePrice';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

interface DeliverySlot {
  id: string;
  slot_name_en: string;
  slot_name_ro: string;
  start_time: string;
  end_time: string;
}

export default function CheckoutPage() {
  const { language } = useLanguage();
  const { cartPath, getOrderConfirmationPath } = useLocalizedPath();
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { formatPrice } = usePrice();
  const toast = useToast();
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    roomNumber: '',
    checkInDate: '',
    deliveryDate: '',
    deliverySlot: '',
    specialInstructions: '',
    paymentMethod: 'cash' as 'online' | 'cash',
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate(cartPath);
      return;
    }

    async function fetchSlots() {
      const { data } = await supabase
        .from('delivery_time_slots')
        .select('*')
        .eq('is_active', true)
        .order('start_time');

      if (data) {
        setDeliverySlots(data);
      }
    }
    fetchSlots();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, deliveryDate: tomorrowStr }));
  }, [items, navigate, cartPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 9).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          guest_name: formData.guestName,
          guest_phone: formData.guestPhone,
          guest_email: formData.guestEmail,
          room_number: formData.roomNumber,
          check_in_date: formData.checkInDate,
          delivery_date: formData.deliveryDate,
          delivery_time_slot_id: formData.deliverySlot || null,
          special_instructions: formData.specialInstructions,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'cash' ? 'pending' : 'paid',
          total_amount: totalAmount,
          order_status: formData.paymentMethod === 'cash' ? 'pending_payment' : 'confirmed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        size_id: item.sizeId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        item_notes: '',
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      navigate(getOrderConfirmationPath(orderNumber));
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (language === 'RO') {
      if (target.validity.valueMissing) {
        target.setCustomValidity('Vă rugăm să completați acest câmp.');
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

  const content = {
    RO: {
      title: 'Finalizare Comanda',
      guestInfo: 'Informatii Oaspete',
      name: 'Nume Complet',
      phone: 'Telefon',
      email: 'Email',
      room: 'Numar Camera',
      checkIn: 'Data Check-in',
      deliveryInfo: 'Informatii Livrare',
      deliveryDate: 'Data Livrare',
      timeSlot: 'Interval Orar',
      selectSlot: 'Selecteaza interval',
      specialInstructions: 'Instructiuni Speciale',
      paymentMethod: 'Metoda de Plata',
      online: 'Plata Online',
      cash: 'Numerar la Livrare',
      cashNotice: 'Comanda va fi confirmata dupa primirea platii la livrare',
      orderSummary: 'Sumar Comanda',
      items: 'articole',
      total: 'Total',
      placeOrder: 'Plaseaza Comanda',
      processing: 'Se proceseaza...',
      requiredField: 'Va rugam sa completati acest camp',
      invalidEmail: 'Va rugam sa introduceti o adresa de email valida',
    },
    EN: {
      title: 'Checkout',
      guestInfo: 'Guest Information',
      name: 'Full Name',
      phone: 'Phone',
      email: 'Email',
      room: 'Room Number',
      checkIn: 'Check-in Date',
      deliveryInfo: 'Delivery Information',
      deliveryDate: 'Delivery Date',
      timeSlot: 'Time Slot',
      selectSlot: 'Select time slot',
      specialInstructions: 'Special Instructions',
      paymentMethod: 'Payment Method',
      online: 'Online Payment',
      cash: 'Cash on Delivery',
      cashNotice: 'Your order will be confirmed once payment is received upon delivery',
      orderSummary: 'Order Summary',
      items: 'items',
      total: 'Total',
      placeOrder: 'Place Order',
      processing: 'Processing...',
      requiredField: 'Please fill out this field',
      invalidEmail: 'Please enter a valid email address',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.guestInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.name} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guestName}
                  onChange={(e) => {
                    setFormData({ ...formData, guestName: e.target.value });
                  }}
                  onInvalid={handleInvalid}
                  onInput={handleInput}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent invalid:border-primary-light invalid:focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.phone} *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.guestPhone}
                  onChange={(e) => {
                    setFormData({ ...formData, guestPhone: e.target.value });
                  }}
                  onInvalid={handleInvalid}
                  onInput={handleInput}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent invalid:border-primary-light invalid:focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.email} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.guestEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, guestEmail: e.target.value });
                  }}
                  onInvalid={handleInvalid}
                  onInput={handleInput}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent invalid:border-primary-light invalid:focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.room} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, roomNumber: e.target.value });
                  }}
                  onInvalid={handleInvalid}
                  onInput={handleInput}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent invalid:border-primary-light invalid:focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.checkIn} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.checkInDate}
                  onChange={(e) => {
                    setFormData({ ...formData, checkInDate: e.target.value });
                  }}
                  onInvalid={handleInvalid}
                  onInput={handleInput}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent invalid:border-primary-light invalid:focus:ring-primary-light"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.deliveryInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t.deliveryDate} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.deliveryDate}
                  onChange={(e) => {
                    setFormData({ ...formData, deliveryDate: e.target.value });
                  }}
                  onInvalid={handleInvalid}
                  onInput={handleInput}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent invalid:border-primary-light invalid:focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {t.timeSlot}
                </label>
                <select
                  value={formData.deliverySlot}
                  onChange={(e) =>
                    setFormData({ ...formData, deliverySlot: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">{t.selectSlot}</option>
                  {deliverySlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {language === 'RO' ? slot.slot_name_ro : slot.slot_name_en} (
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.specialInstructions}
              </label>
              <textarea
                rows={3}
                value={formData.specialInstructions}
                onChange={(e) =>
                  setFormData({ ...formData, specialInstructions: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.paymentMethod}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="font-semibold text-gray-900">{t.cash}</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.paymentMethod === 'online'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="font-semibold text-gray-900">{t.online}</div>
              </button>
            </div>
            {formData.paymentMethod === 'cash' && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-dark">{t.cashNotice}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.orderSummary}</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => {
                const title = language === 'RO' ? item.productTitleRo : item.productTitleEn;
                return (
                  <div key={`${item.productId}-${item.sizeId}`} className="flex justify-between">
                    <span className="text-gray-700">
                      {item.quantity}x {title} {item.sizeName ? `(${item.sizeName})` : ''}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>{t.total}</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary-dark transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t.processing : t.placeOrder}
          </button>
        </form>
      </div>
    </div>
  );
}
