import React from 'react';
import { MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import GoogleMap from './GoogleMap';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSection } from '../hooks/useCMS';

const ICON_MAP = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

const BlockIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const Icon = ICON_MAP[name] || MapPin;
  return <Icon className={className} />;
};

const Location: React.FC = () => {
  const { language } = useLanguage();
  const { section, blocks } = usePageSection('home', 'location');

  const lang = language === 'RO' ? 'RO' : 'EN';
  const settings = section?.settings as Record<string, string> | undefined;

  const title = (lang === 'RO' ? section?.title_ro : section?.title_en) || (lang === 'RO' ? 'Locație Privilegiată' : 'Prime Location');
  const subtitle = (lang === 'RO' ? section?.subtitle_ro : section?.subtitle_en) || (lang === 'RO' ? 'În inima Bucureștiului cu acces facil la toate facilitățile' : 'In the heart of Bucharest with easy access to all facilities');
  const mapTitle = settings?.[lang === 'RO' ? 'map_title_ro' : 'map_title_en'] || (lang === 'RO' ? 'Găsește-ne pe hartă' : 'Find us on the map');
  const nearbyTitle = settings?.[lang === 'RO' ? 'nearby_title_ro' : 'nearby_title_en'] || (lang === 'RO' ? 'În apropiere' : 'Nearby');

  const nearbyItems = blocks.filter(b => b.type === 'nearby');
  const highlights = blocks.filter(b => b.type === 'highlight');

  return (
    <section id="location" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {mapTitle}
            </h3>
            <GoogleMap language={language} />
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600">
                <p className="font-semibold">Petricani 22</p>
                <p>Bucharest, Romania</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              {nearbyTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {nearbyItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
                    <BlockIcon name={item.icon || 'MapPin'} className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {lang === 'RO' ? item.title_ro : item.title_en}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {item.link_url ? (
                      <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        {lang === 'RO' ? item.description_ro : item.description_en}
                      </a>
                    ) : (
                      lang === 'RO' ? item.description_ro : item.description_en
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {highlights.map((h, index) => (
                <div key={h.id || index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BlockIcon name={h.icon || 'MapPin'} className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {lang === 'RO' ? h.title_ro : h.title_en}
                  </h4>
                  <p className="text-gray-600">
                    {lang === 'RO' ? h.description_ro : h.description_en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Location;
