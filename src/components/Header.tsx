import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import PreferencesDropdown from './PreferencesDropdown';
import { throttle } from '../lib/utils';

const Header: React.FC = () => {
  const { t } = useLanguage();
  const { homePath, accommodationsPath, menuPath, inspirationPath } = useLocalizedPath();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRentalsDropdownOpen, setIsRentalsDropdownOpen] = useState(false);
  const [isMobileRentalsOpen, setIsMobileRentalsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = throttle(() => {
      setIsScrolled(window.scrollY > 20);
    }, 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rentalsSubItems = [
    { label: t('Închirieri', 'Rentals'), href: accommodationsPath, isLink: true },
    { label: t('Meniu Digital', 'Digital Menu'), href: menuPath, isLink: true }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <Link to={homePath} className="block text-lg sm:text-xl lg:text-2xl font-bold text-primary hover:text-primary-dark transition-colors truncate">
              Petricani 22
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to={homePath}
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
            >
              {t('Acasă', 'Home')}
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setIsRentalsDropdownOpen(true)}
              onMouseLeave={() => setIsRentalsDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors duration-200 font-medium py-2">
                {t('Închirieri', 'Rentals')}
                <ChevronDown size={16} className={`transition-transform ${isRentalsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRentalsDropdownOpen && (
                <div className="absolute top-full left-0 pt-2 w-48">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                    {rentalsSubItems.map((subItem) => (
                      <Link
                        key={subItem.label}
                        to={subItem.href}
                        onClick={() => setIsRentalsDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to={inspirationPath}
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
            >
              {t('Inspirație', 'Inspiration')}
            </Link>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            <PreferencesDropdown />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 sm:p-3 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-gray-700 hover:text-primary transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="relative w-6 h-6 flex items-center justify-center">
                <span
                  className={`absolute block w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
                  }`}
                />
                <span
                  className={`absolute block w-6 h-0.5 bg-current transition-all duration-200 ease-in-out ${
                    isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`}
                />
                <span
                  className={`absolute block w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                    isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          className={`lg:hidden fixed inset-0 top-[60px] sm:top-[68px] bg-black/50 z-40 transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <nav
          className={`lg:hidden absolute left-0 right-0 top-full bg-white shadow-lg border-t border-gray-200 z-50 transition-all duration-300 ease-in-out origin-top ${
            isMenuOpen
              ? 'opacity-100 scale-y-100 translate-y-0'
              : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="container mx-auto px-4 py-4 flex flex-col">
            <Link
              to={homePath}
              onClick={() => setIsMenuOpen(false)}
              className="text-left py-4 min-h-[48px] text-gray-700 hover:text-primary active:bg-gray-50 transition-colors font-medium border-b border-gray-100"
            >
              {t('Acasă', 'Home')}
            </Link>

            <div className="border-b border-gray-100">
              <button
                onClick={() => setIsMobileRentalsOpen(!isMobileRentalsOpen)}
                className="w-full flex items-center justify-between py-4 min-h-[48px] text-gray-700 hover:text-primary active:bg-gray-50 transition-colors font-medium"
              >
                {t('Închirieri', 'Rentals')}
                <ChevronDown size={20} className={`transition-transform duration-200 ${isMobileRentalsOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isMobileRentalsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pb-2 flex flex-col bg-gray-50 -mx-4 px-4">
                  {rentalsSubItems.map((subItem) => (
                    <Link
                      key={subItem.label}
                      to={subItem.href}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileRentalsOpen(false);
                      }}
                      className="text-left py-3 min-h-[44px] pl-4 text-gray-600 hover:text-primary active:bg-gray-100 transition-colors"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to={inspirationPath}
              onClick={() => setIsMenuOpen(false)}
              className="text-left py-4 min-h-[48px] text-gray-700 hover:text-primary active:bg-gray-50 transition-colors font-medium"
            >
              {t('Inspirație', 'Inspiration')}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
