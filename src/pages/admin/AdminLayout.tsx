import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Clock,
  Mail,
  Settings,
  Menu,
  X,
  Home,
  ChevronDown,
  LogOut,
  FileText,
  Image,
  Globe,
  DollarSign,
  Bed,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
  {
    label: 'Menu',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    children: [
      { label: 'Categories', path: '/admin/categories' },
      { label: 'Products', path: '/admin/products' },
      { label: 'Product Sync', path: '/admin/product-sync' },
    ],
  },
  {
    label: 'Content',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { label: 'Page Sections', path: '/admin/content' },
      { label: 'Articles', path: '/admin/articles' },
      { label: 'Navigation', path: '/admin/navigation' },
      { label: 'FAQs', path: '/admin/faqs' },
      { label: 'Testimonials', path: '/admin/testimonials' },
    ],
  },
  {
    label: 'Rentals',
    icon: <Bed className="w-5 h-5" />,
    children: [
      { label: 'Rentals', path: '/admin/rentals' },
      { label: 'Bookings', path: '/admin/bookings' },
      { label: 'Availability', path: '/admin/availability' },
      { label: 'Guidebook', path: '/admin/guidebook' },
    ],
  },
  { label: 'Rental Options', path: '/admin/rental-options', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Media Library', path: '/admin/media', icon: <Image className="w-5 h-5" /> },
  { label: 'Delivery Settings', path: '/admin/delivery', icon: <Clock className="w-5 h-5" /> },
  { label: 'Contact Submissions', path: '/admin/contacts', icon: <Mail className="w-5 h-5" /> },
  { label: 'Site Settings', path: '/admin/site-settings', icon: <Globe className="w-5 h-5" /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

function getActiveSection(pathname: string): string | null {
  for (const item of navItems) {
    if (item.children?.some((child) => pathname === child.path || pathname.startsWith(child.path + '/'))) {
      return item.label;
    }
  }
  return null;
}

function CollapsibleSection({
  item,
  isExpanded,
  onToggle,
  onLinkClick,
}: {
  item: NavItem;
  isExpanded: boolean;
  onToggle: () => void;
  onLinkClick: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-lg"
      >
        <span className="flex items-center gap-3">
          {item.icon}
          <span className="font-medium text-sm">{item.label}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
        />
      </button>
      <div
        className="overflow-hidden transition-[height] duration-200 ease-in-out"
        style={{ height }}
      >
        <div ref={contentRef} className="ml-4 mt-0.5 space-y-0.5 pb-1">
          {item.children!.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onLinkClick}
              className={({ isActive }) =>
                `block px-4 py-2 pl-8 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    () => getActiveSection(location.pathname)
  );
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const active = getActiveSection(location.pathname);
    if (active && active !== expandedMenu) {
      setExpandedMenu(active);
    }
  }, [location.pathname]);

  const toggleMenu = useCallback((label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-dark flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-black shrink-0">
          <span className="text-xl font-bold text-white">Admin Panel</span>
          <button
            onClick={closeSidebar}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
          {navItems.map((item) =>
            item.children ? (
              <CollapsibleSection
                key={item.label}
                item={item}
                isExpanded={expandedMenu === item.label}
                onToggle={() => toggleMenu(item.label)}
                onLinkClick={closeSidebar}
              />
            ) : (
              <NavLink
                key={item.path}
                to={item.path!}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
                end={item.path === '/admin'}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="shrink-0 p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => navigate('/ro')}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-sm"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Back to Site</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
