import { useState, useRef, useEffect } from 'react';
import { Users, Minus, Plus, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface GuestSelectorProps {
  guests: number;
  onGuestsChange: (guests: number) => void;
  maxGuests: number;
}

const content = {
  EN: {
    guest: 'guest',
    guests: 'guests',
    adults: 'Adults',
    children: 'Children',
    infants: 'Infants',
  },
  RO: {
    guest: 'oaspete',
    guests: 'oaspeți',
    adults: 'Adulți',
    children: 'Copii',
    infants: 'Bebeluși',
  },
};

export default function GuestSelector({
  guests,
  onGuestsChange,
  maxGuests,
}: GuestSelectorProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = content[language];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const increment = () => {
    if (guests < maxGuests) {
      onGuestsChange(guests + 1);
    }
  };

  const decrement = () => {
    if (guests > 1) {
      onGuestsChange(guests - 1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-400" />
          <span className="text-gray-900">
            {guests} {guests === 1 ? t.guest : t.guests}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-20">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">{t.adults}</div>
              <div className="text-sm text-gray-500">
                {language === 'EN' ? 'Ages 13+' : 'Peste 13 ani'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={decrement}
                disabled={guests <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{guests}</span>
              <button
                onClick={increment}
                disabled={guests >= maxGuests}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t">
            {language === 'EN'
              ? `Maximum ${maxGuests} guests`
              : `Maxim ${maxGuests} oaspeți`}
          </div>
        </div>
      )}
    </div>
  );
}
