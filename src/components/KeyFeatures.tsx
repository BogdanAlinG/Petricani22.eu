import React from 'react';
import {
  Home,
  Maximize,
  Bed,
  Bath,
  Calendar,
  Loader as Road,
  Settings,
  Car,
  Wifi,
  Thermometer,
  Utensils,
  TreePine,
  Sofa,
  Sparkles,
  Star,
  Heart,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSection } from '../hooks/useCMS';
import { useScrollReveal, useStaggeredReveal } from '../hooks/useScrollReveal';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Maximize,
  Bed,
  Bath,
  Calendar,
  Road,
  Settings,
  Car,
  Wifi,
  Thermometer,
  Utensils,
  TreePine,
  Sofa,
  Sparkles,
  Star,
  Heart,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
};

const KeyFeatures: React.FC = () => {
  const { language } = useLanguage();
  const { section, blocks, loading } = usePageSection('home', 'features');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: gridRef, visibleCount } = useStaggeredReveal(blocks.length || 4);

  if (loading) {
    return (
      <section id="property" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!section) {
    return null;
  }

  const title = language === 'RO' ? section.title_ro : section.title_en;
  const subtitle = language === 'RO' ? section.subtitle_ro : section.subtitle_en;

  return (
    <section id="property" className="py-20 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {blocks.map((block, index) => {
            const Icon = block.icon ? iconMap[block.icon] : Star;
            const blockTitle = language === 'RO' ? block.title_ro : block.title_en;
            const blockDescription = language === 'RO' ? block.description_ro : block.description_en;
            const isItemVisible = index < visibleCount;

            return (
              <div
                key={block.id}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                style={{
                  opacity: isItemVisible ? 1 : 0,
                  transform: isItemVisible ? 'translateY(0)' : 'translateY(32px)',
                  transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  {Icon && (
                    <Icon className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {blockTitle}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {blockDescription}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
