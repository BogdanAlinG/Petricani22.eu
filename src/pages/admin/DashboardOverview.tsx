import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Euro,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProducts: number;
  activeProducts: number;
  pendingContacts: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  guest_name: string;
  total_amount: number;
  order_status: string;
  created_at: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    pendingContacts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0];

    const [
      ordersResult,
      todayOrdersResult,
      pendingOrdersResult,
      productsResult,
      contactsResult,
    ] = await Promise.all([
      supabase.from('orders').select('total_amount'),
      supabase.from('orders').select('total_amount').gte('created_at', today),
      supabase.from('orders').select('id').in('order_status', ['pending_payment', 'confirmed', 'preparing']),
      supabase.from('products').select('is_available'),
      supabase.from('contact_submissions').select('id').eq('status', 'pending'),
    ]);

    const totalRevenue = (ordersResult.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
    const todayRevenue = (todayOrdersResult.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
    const products = productsResult.data || [];

    setStats({
      totalOrders: ordersResult.data?.length || 0,
      todayOrders: todayOrdersResult.data?.length || 0,
      pendingOrders: pendingOrdersResult.data?.length || 0,
      totalRevenue,
      todayRevenue,
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.is_available).length,
      pendingContacts: contactsResult.data?.length || 0,
    });
    setLoading(false);
  }

  async function fetchRecentOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, guest_name, total_amount, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentOrders(data);
    }
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{stats.todayOrders} today</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/orders"
              className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              View orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Euro className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">{formatCurrency(stats.todayRevenue)} today</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-gray-600">{stats.activeProducts} active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No orders yet</div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to="/admin/orders"
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{order.order_number}</div>
                    <div className="text-sm text-gray-600">{order.guest_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.order_status)}`}>
                      {order.order_status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              to="/admin/products"
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Manage Products</div>
                <div className="text-sm text-gray-600">Add, edit, or remove menu items</div>
              </div>
            </Link>

            <Link
              to="/admin/categories"
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Manage Categories</div>
                <div className="text-sm text-gray-600">Organize your menu categories</div>
              </div>
            </Link>

            {stats.pendingContacts > 0 && (
              <Link
                to="/admin/contacts"
                className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/20"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {stats.pendingContacts} Pending Contact{stats.pendingContacts !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-600">Review new contact submissions</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
