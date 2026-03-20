import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { throttle } from '../lib/utils';

const SECTIONS = [
  { id: 'property', labelRo: 'Proprietatea', labelEn: 'Property' },
  { id: 'gallery',  labelRo: 'Galerie',      labelEn: 'Gallery' },
  { id: 'amenities',labelRo: 'Facilități',   labelEn: 'Amenities' },
  { id: 'pricing',  labelRo: 'Prețuri',      labelEn: 'Pricing' },
  { id: 'location', labelRo: 'Locație',       labelEn: 'Location' },
  { id: 'contact',  labelRo: 'Contact',       labelEn: 'Contact' },
];

const HEADER_HEIGHT = 72;
const TRIGGER_OFFSET = 80;

const PropertyStickyNav: React.FC = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const getThreshold = () => {
      const anchorEl = document.getElementById('property');
      if (!anchorEl) return 200;
      const top = anchorEl.getBoundingClientRect().top + window.scrollY;
      return Math.max(top - HEADER_HEIGHT - TRIGGER_OFFSET, 200);
    };

    let showThreshold = getThreshold();

    // Throttle scroll handler to improve performance
    const handleScroll = throttle(() => {
      const scrollY = window.scrollY;
      setVisible(scrollY >= showThreshold);

      let current = '';
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= HEADER_HEIGHT + 80) {
          current = section.id;
        }
      }
      setActiveSection(current);
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    const container = scrollContainerRef.current;
    const btn = buttonRefs.current[activeSection];
    if (!container || !btn) return;

    const containerLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const btnLeft = btn.offsetLeft;
    const btnWidth = btn.offsetWidth;

    const btnRight = btnLeft + btnWidth;
    const containerRight = containerLeft + containerWidth;

    if (btnLeft < containerLeft + 16) {
      container.scrollTo({ left: btnLeft - 16, behavior: 'smooth' });
    } else if (btnRight > containerRight - 16) {
      container.scrollTo({ left: btnRight - containerWidth + 16, behavior: 'smooth' });
    }
  }, [activeSection]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT - 4;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ top: `${HEADER_HEIGHT}px` }}
    >
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4">
          <div ref={scrollContainerRef} className="flex items-center overflow-x-auto scrollbar-hide">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              const label = language === 'RO' ? section.labelRo : section.labelEn;
              return (
                <button
                  key={section.id}
                  ref={(el) => { buttonRefs.current[section.id] = el; }}
                  onClick={() => scrollTo(section.id)}
                  className={`relative flex-shrink-0 px-5 py-4 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    }`}
                    style={{ transformOrigin: 'center' }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyStickyNav;
