import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSlugContext } from '../contexts/SlugContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getEquivalentPath } from '../hooks/useLocalizedPath';

const PreferencesDropdown: React.FC = () => {
  const { language } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { currentSlugPair } = useSlugContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLanguageSwitch = (newLang: 'RO' | 'EN') => {
    if (newLang !== language) {
      const newPath = getEquivalentPath(location.pathname, newLang, currentSlugPair || undefined);
      navigate(newPath + location.search + location.hash);
    }
    setIsOpen(false);
  };

  const handleCurrencySwitch = (newCurrency: 'EUR' | 'RON') => {
    if (newCurrency !== currency) {
      setCurrency(newCurrency);
    }
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className="p-1.5 sm:p-2 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-full text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
        aria-label="Language and currency preferences"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={20} />
      </button>

      <div
        className={`absolute top-full right-0 pt-2 z-50 transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px]">
          <button
            onClick={() => handleLanguageSwitch('EN')}
            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
              language === 'EN' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            <span className="font-medium">English</span>
            {language === 'EN' && <Check size={16} />}
          </button>
          <button
            onClick={() => handleLanguageSwitch('RO')}
            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
              language === 'RO' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            <span className="font-medium">Romana</span>
            {language === 'RO' && <Check size={16} />}
          </button>

          <div className="my-2 border-t border-gray-200" />

          <button
            onClick={() => handleCurrencySwitch('EUR')}
            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
              currency === 'EUR' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            <span className="font-medium">Euro (EUR)</span>
            {currency === 'EUR' && <Check size={16} />}
          </button>
          <button
            onClick={() => handleCurrencySwitch('RON')}
            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
              currency === 'RON' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            <span className="font-medium">Lei (RON)</span>
            {currency === 'RON' && <Check size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesDropdown;
