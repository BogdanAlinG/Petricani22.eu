import React from 'react';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTestimonials, usePageSection } from '../hooks/useCMS';
import { useScrollReveal, useStaggeredReveal } from '../hooks/useScrollReveal';

const Testimonials: React.FC = () => {
  const { language } = useLanguage();
  const { testimonials, loading: testimonialsLoading } = useTestimonials(true);
  const { section, loading: sectionLoading } = usePageSection('home', 'testimonials');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: gridRef, visibleCount } = useStaggeredReveal(testimonials.length || 3);

  const defaultTitle = language === 'RO' ? 'Ce spun oaspetii nostri' : 'What Our Guests Say';
  const defaultSubtitle =
    language === 'RO'
      ? 'Experiente reale de la persoane care au trait atmosfera de la Petricani 22'
      : 'Real experiences from people who have lived the Petricani 22 atmosphere';

  const title = section
    ? (language === 'RO' ? section.title_ro : section.title_en) || defaultTitle
    : defaultTitle;
  const subtitle = section
    ? (language === 'RO' ? section.subtitle_ro : section.subtitle_en) || defaultSubtitle
    : defaultSubtitle;

  if (sectionLoading || testimonialsLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </section>
    );
  }

  if (!testimonials.length) return null;

  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{title}</h2>
          <div
            className="h-1 bg-primary rounded-full mx-auto mt-4 mb-6"
            style={{
              width: headerVisible ? '64px' : '0px',
              transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: '0.3s',
            }}
          />
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, index) => {
            const isItemVisible = index < visibleCount;
            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-5 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
                style={{
                  opacity: isItemVisible ? 1 : 0,
                  transform: isItemVisible ? 'translateY(0)' : 'translateY(40px)',
                  transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 to-primary/10 rounded-l-2xl" />
                <Quote className="w-8 h-8 text-primary/20 flex-shrink-0" />
                <p className="text-gray-700 leading-relaxed flex-1 italic">
                  {language === 'RO' ? t.content_ro : t.content_en}
                </p>
                <div className="flex items-center gap-1 mt-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 transition-all duration-200 ${
                        i < t.rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-200 fill-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  {t.author_image_url ? (
                    <img
                      src={t.author_image_url}
                      alt={t.author_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {t.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.author_name}</p>
                    {t.author_title && (
                      <p className="text-gray-500 text-xs">{t.author_title}</p>
                    )}
                  </div>
                  {t.source && (
                    <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      {t.source}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
