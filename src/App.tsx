import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { QuoteProvider } from './contexts/QuoteContext';
import { SlugProvider } from './contexts/SlugContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { LanguageProvider, LanguageRedirect } from './contexts/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import InspirationPage from './pages/InspirationPage';
import ArticlePage from './pages/ArticlePage';
import MenuLandingPage from './pages/MenuLandingPage';
import MenuCategoryPage from './pages/MenuCategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccommodationsPage from './pages/AccommodationsPage';
import AccommodationDetailPage from './pages/AccommodationDetailPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import GuidebookPage from './pages/GuidebookPage';

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview'));
const OrdersManagement = lazy(() => import('./pages/admin/OrdersManagement'));
const CategoriesManagement = lazy(() => import('./pages/admin/CategoriesManagement'));
const ProductsManagement = lazy(() => import('./pages/admin/ProductsManagement'));
const DeliverySettings = lazy(() => import('./pages/admin/DeliverySettings'));
const ContactSubmissions = lazy(() => import('./pages/admin/ContactSubmissions'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const MediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'));
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings'));
const ContentEditor = lazy(() => import('./pages/admin/ContentEditor'));
const NavigationEditor = lazy(() => import('./pages/admin/NavigationEditor'));
const FAQManagement = lazy(() => import('./pages/admin/FAQManagement'));
const TestimonialsManagement = lazy(() => import('./pages/admin/TestimonialsManagement'));
const ArticlesManagement = lazy(() => import('./pages/admin/ArticlesManagement'));
const RentalOptionsManagement = lazy(() => import('./pages/admin/RentalOptionsManagement'));
const ProductSync = lazy(() => import('./pages/admin/ProductSync'));
const AccommodationsManagement = lazy(() => import('./pages/admin/AccommodationsManagement'));
const BookingsManagement = lazy(() => import('./pages/admin/BookingsManagement'));
const AvailabilityCalendar = lazy(() => import('./pages/admin/AvailabilityCalendar'));
const GuidebookManagement = lazy(() => import('./pages/admin/GuidebookManagement'));

function AdminFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner label="Loading..." />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <QuoteProvider>
            <SlugProvider>
              <NavigationProvider>
                <Analytics />
                <Routes>
                  <Route path="/" element={<LanguageRedirect />} />

                  <Route path="/ro" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="cazare" element={<AccommodationsPage />} />
                    <Route path="cazare/:slug" element={<AccommodationDetailPage />} />
                    <Route path="rezerva/:slug" element={<BookingPage />} />
                    <Route path="confirmare-rezervare/:bookingNumber" element={<BookingConfirmationPage />} />
                    <Route path="meniu" element={<MenuLandingPage />} />
                    <Route path="meniu/categorie/:slug" element={<MenuCategoryPage />} />
                    <Route path="meniu/produs/:slug" element={<ProductDetailPage />} />
                    <Route path="inspiratie" element={<InspirationPage />} />
                    <Route path="inspiratie/:id" element={<ArticlePage />} />
                    <Route path="cos" element={<CartPage />} />
                    <Route path="finalizare-comanda" element={<CheckoutPage />} />
                    <Route path="confirmare-comanda/:orderNumber" element={<OrderConfirmationPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>

                  <Route path="/en" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="accommodations" element={<AccommodationsPage />} />
                    <Route path="accommodations/:slug" element={<AccommodationDetailPage />} />
                    <Route path="book/:slug" element={<BookingPage />} />
                    <Route path="booking-confirmation/:bookingNumber" element={<BookingConfirmationPage />} />
                    <Route path="menu" element={<MenuLandingPage />} />
                    <Route path="menu/category/:slug" element={<MenuCategoryPage />} />
                    <Route path="menu/product/:slug" element={<ProductDetailPage />} />
                    <Route path="inspiration" element={<InspirationPage />} />
                    <Route path="inspiration/:id" element={<ArticlePage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>

                  <Route path="/admin/login" element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminLogin />
                    </Suspense>
                  } />
                  <Route
                    path="/admin"
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <ProtectedRoute>
                          <AdminLayout />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  >
                    <Route index element={<DashboardOverview />} />
                    <Route path="orders" element={<OrdersManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="products" element={<ProductsManagement />} />
                    <Route path="product-sync" element={<ProductSync />} />
                    <Route path="content" element={<ContentEditor />} />
                    <Route path="articles" element={<ArticlesManagement />} />
                    <Route path="navigation" element={<NavigationEditor />} />
                    <Route path="faqs" element={<FAQManagement />} />
                    <Route path="testimonials" element={<TestimonialsManagement />} />
                    <Route path="rental-options" element={<RentalOptionsManagement />} />
                    <Route path="accommodations" element={<AccommodationsManagement />} />
                    <Route path="bookings" element={<BookingsManagement />} />
                    <Route path="availability" element={<AvailabilityCalendar />} />
                    <Route path="guidebook" element={<GuidebookManagement />} />
                    <Route path="media" element={<MediaLibrary />} />
                    <Route path="delivery" element={<DeliverySettings />} />
                    <Route path="contacts" element={<ContactSubmissions />} />
                    <Route path="site-settings" element={<SiteSettings />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  <Route path="/guide/:slug" element={<GuidebookPage />} />

                  <Route path="/menu" element={<Navigate to="/ro/meniu" replace />} />
                  <Route path="/inspiratie" element={<Navigate to="/ro/inspiratie" replace />} />
                  <Route path="/inspiration" element={<Navigate to="/en/inspiration" replace />} />
                  <Route path="/cart" element={<Navigate to="/ro/cos" replace />} />
                  <Route path="/checkout" element={<Navigate to="/ro/finalizare-comanda" replace />} />

                  <Route path="*" element={<Navigate to="/ro" replace />} />
                </Routes>
              </NavigationProvider>
            </SlugProvider>
          </QuoteProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
