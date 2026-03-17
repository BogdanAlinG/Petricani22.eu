import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSection } from '../hooks/useCMS';
import { useScrollReveal, useStaggeredReveal } from '../hooks/useScrollReveal';

const ICON_MAP = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

const AmenityIcon: React.FC<{ name: string }> = ({ name }) => {
  const Icon = ICON_MAP[name] || LucideIcons.Star;
  return <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary group-hover:text-white transition-colors duration-300" />;
};

const Amenities: React.FC = () => {
  const { language } = useLanguage();
  const { section, blocks } = usePageSection('home', 'amenities');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const amenities = blocks.filter(b => b.type === 'amenity');
  const specialFeatures = blocks.filter(b => b.type === 'special_feature');
  const { ref: gridRef, visibleCount } = useStaggeredReveal(amenities.length || 4);
  const { ref: specialRef, isVisible: specialVisible } = useScrollReveal();

  const lang = language === 'RO' ? 'RO' : 'EN';
  const settings = section?.settings as Record<string, string> | undefined;

  const title = (lang === 'RO' ? section?.title_ro : section?.title_en) || (lang === 'RO' ? 'Facilități și Servicii' : 'Amenities & Services');
  const subtitle = (lang === 'RO' ? section?.subtitle_ro : section?.subtitle_en) || (lang === 'RO' ? 'Toate facilitățile necesare pentru o experiență confortabilă' : 'All necessary facilities for a comfortable experience');
  const specialTitle = settings?.[lang === 'RO' ? 'special_features_title_ro' : 'special_features_title_en'] || (lang === 'RO' ? 'Facilități Speciale' : 'Special Features');

  return (
    <section id="amenities" className="py-12 md:py-20 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          ref={headerRef}
          className={`text-center mb-8 md:mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            {title}
          </h2>
          <div
            className="h-1 bg-primary rounded-full mx-auto mt-4 mb-6"
            style={{
              width: headerVisible ? '64px' : '0px',
              transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: '0.3s',
            }}
          />
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            {subtitle}
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {amenities.map((amenity, index) => {
            const isItemVisible = index < visibleCount;
            return (
              <div
                key={amenity.id || index}
                className="group bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                style={{
                  opacity: isItemVisible ? 1 : 0,
                  transform: isItemVisible ? 'translateY(0)' : 'translateY(32px)',
                  transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <AmenityIcon name={amenity.icon || 'Star'} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {lang === 'RO' ? amenity.title_ro : amenity.title_en}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {lang === 'RO' ? amenity.description_ro : amenity.description_en}
                </p>
              </div>
            );
          })}
        </div>

        <div
          ref={specialRef}
          className={`mt-10 md:mt-16 bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 lg:p-12 shadow-xl transition-all duration-700 ${
            specialVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div
              className={`transition-all duration-700 ${
                specialVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
              style={{ transitionDelay: '0.2s' }}
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                {specialTitle}
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                {specialFeatures.map((feature, index) => (
                  <li
                    key={feature.id || index}
                    className="flex items-center space-x-3"
                    style={{
                      opacity: specialVisible ? 1 : 0,
                      transform: specialVisible ? 'translateX(0)' : 'translateX(-16px)',
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      transitionDelay: `${0.3 + index * 0.08}s`,
                    }}
                  >
                    <div className="w-2 h-2 min-w-[8px] bg-primary rounded-full" />
                    <span className="text-gray-700 text-sm sm:text-base">
                      {lang === 'RO' ? feature.title_ro : feature.title_en}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className={`relative order-first lg:order-last transition-all duration-700 ${
                specialVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '0.15s' }}
            >
              <img
                src="https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Garden area"
                className="rounded-xl sm:rounded-2xl shadow-lg w-full aspect-video object-cover"
                loading="lazy"
              />
              <div className="hidden sm:block absolute -bottom-6 -right-6 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Amenities;
