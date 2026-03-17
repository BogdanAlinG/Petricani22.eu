import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Home,
  CheckCircle,
  XCircle,
  Package,
  Search,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  room_number: string;
  delivery_date: string;
  special_instructions: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  order_status: string;
  created_at: string;
}

interface OrderItem {
  quantity: number;
  unit_price: number;
  products: {
    title_en: string;
  };
  product_sizes: {
    size_name_en: string;
  } | null;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'tomorrow' | 'pending' | 'confirmed'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (filter === 'today') {
      query = query.eq('delivery_date', today);
    } else if (filter === 'tomorrow') {
      query = query.eq('delivery_date', tomorrow);
    } else if (filter === 'pending') {
      query = query.eq('payment_status', 'pending');
    } else if (filter === 'confirmed') {
      query = query.in('order_status', ['confirmed', 'preparing', 'ready']);
    }

    const { data } = await query;
    if (data) {
      setOrders(data);
    }
    setLoading(false);
  }

  async function fetchOrderItems(orderId: string) {
    const { data } = await supabase
      .from('order_items')
      .select(`
        *,
        products (title_en),
        product_sizes (size_name_en)
      `)
      .eq('order_id', orderId);

    if (data) {
      setOrderItems(data);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    await supabase
      .from('orders')
      .update({ order_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    fetchOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, order_status: newStatus });
    }
  }

  async function updatePaymentStatus(orderId: string, newStatus: string) {
    const updates: Record<string, string> = {
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'paid') {
      updates.order_status = 'confirmed';
    }

    await supabase.from('orders').update(updates).eq('id', orderId);

    fetchOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        payment_status: newStatus,
        order_status: updates.order_status || selectedOrder.order_status,
      });
    }
  }

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      delivered: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.room_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage customer orders and deliveries</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, name, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'today', 'tomorrow', 'pending', 'confirmed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[calc(100vh-340px)] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No orders found</div>
            ) : (
              filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedOrder?.id === order.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{order.order_number}</div>
                      <div className="text-sm text-gray-600">{order.guest_name}</div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        order.order_status
                      )}`}
                    >
                      {order.order_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-4 h-4" />
                      Room {order.room_number}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Order Details</h2>
          </div>
          {selectedOrder ? (
            <div className="p-6 space-y-6 max-h-[calc(100vh-340px)] overflow-y-auto">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedOrder.order_number}
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                    selectedOrder.order_status
                  )}`}
                >
                  {selectedOrder.order_status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Guest</div>
                    <div className="font-semibold text-gray-900">
                      {selectedOrder.guest_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <a
                      href={`tel:${selectedOrder.guest_phone}`}
                      className="font-semibold text-primary hover:text-primary-dark"
                    >
                      {selectedOrder.guest_phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <a
                      href={`mailto:${selectedOrder.guest_email}`}
                      className="font-semibold text-primary hover:text-primary-dark"
                    >
                      {selectedOrder.guest_email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Room</div>
                    <div className="font-semibold text-gray-900">
                      {selectedOrder.room_number}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Delivery Date</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(selectedOrder.delivery_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.special_instructions && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-semibold text-amber-900 mb-1">
                    Special Instructions
                  </div>
                  <div className="text-sm text-amber-800">
                    {selectedOrder.special_instructions}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Items</h3>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <div>
                        <span className="text-gray-900">
                          {item.quantity}x {item.products.title_en}
                        </span>
                        {item.product_sizes && (
                          <span className="text-gray-600 text-sm ml-2">
                            ({item.product_sizes.size_name_en})
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatPrice(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="font-semibold text-gray-900">
                    {selectedOrder.payment_method === 'cash' ? 'Cash' : 'Online'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      selectedOrder.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedOrder.payment_status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-bold text-gray-900">Actions</h3>

                {selectedOrder.payment_status === 'pending' && (
                  <button
                    onClick={() => updatePaymentStatus(selectedOrder.id, 'paid')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Paid
                  </button>
                )}

                {selectedOrder.order_status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Start Preparing
                  </button>
                )}

                {selectedOrder.order_status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Ready
                  </button>
                )}

                {selectedOrder.order_status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Delivered
                  </button>
                )}

                {selectedOrder.order_status !== 'cancelled' &&
                  selectedOrder.order_status !== 'delivered' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Order
                    </button>
                  )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
