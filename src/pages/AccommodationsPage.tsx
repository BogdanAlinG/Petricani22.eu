import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Users, ArrowRight, Star, Loader, Maximize2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAccommodations, calculateMinPricePerNight } from '../hooks/useAccommodations';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { useScrollReveal } from '../hooks/useScrollReveal';
import type { Accommodation } from '../types/accommodation';

const content = {
  EN: {
    eyebrow: 'Spaces & Rentals',
    title: 'Our Rentals',
    subtitle: 'Unique spaces designed for comfort, creativity, and living.',
    from: 'from',
    perNight: '/ night',
    viewDetails: 'View details',
    beds: 'beds',
    baths: 'baths',
    guests: 'guests',
    sqm: 'm²',
    featured: 'Featured',
    noAccommodations: 'No rentals available at the moment.',
  },
  RO: {
    eyebrow: 'Spații și Închirieri',
    title: 'Unitățile Noastre',
    subtitle: 'Spații unice gândite pentru confort, creativitate și viață.',
    from: 'de la',
    perNight: '/ noapte',
    viewDetails: 'Vezi detalii',
    beds: 'paturi',
    baths: 'băi',
    guests: 'oaspeți',
    sqm: 'm²',
    featured: 'Recomandat',
    noAccommodations: 'Nu există unități disponibile momentan.',
  },
};

function AccommodationCard({ accommodation, index }: { accommodation: Accommodation; index: number }) {
  const { language } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const { getAccommodationPath } = useLocalizedPath();
  const t = content[language];
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  const title = language === 'EN' ? accommodation.title_en : accommodation.title_ro;
  const description =
    language === 'EN'
      ? accommodation.short_description_en
      : accommodation.short_description_ro;

  const minPrice = calculateMinPricePerNight(accommodation);
  const price =
    currency === 'EUR'
      ? minPrice
      : Math.round(minPrice * (exchangeRate || 4.95));

  const currencySymbol = currency === 'EUR' ? '€' : 'RON';
  const detailPath = getAccommodationPath({ slug: accommodation.slug, slug_ro: accommodation.slug_ro });

  const priceSuffix = accommodation.unit_type_info
    ? ` / ${language === 'EN' ? accommodation.unit_type_info.price_suffix_en : accommodation.unit_type_info.price_suffix_ro}`
    : t.perNight;

  const showBeds = accommodation.unit_type_info?.show_beds !== false;

  const isFeaturedLarge = index === 0 && accommodation.is_featured;

  if (isFeaturedLarge) {
    return (
      <div
        ref={ref}
        className="col-span-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
      <Link
        to={detailPath}
        className="group col-span-full relative overflow-hidden rounded-3xl bg-gray-900 min-h-[420px] md:min-h-[500px] flex flex-col justify-end"
      >
        <img
          src={
            accommodation.thumbnail_url ||
            'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200'
          }
          alt={title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-6 left-6 flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <Star className="w-3.5 h-3.5 fill-current" />
            {t.featured}
          </span>
        </div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{title}</h3>
            {description && (
              <p className="text-white/70 text-base max-w-lg line-clamp-2">{description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-white/60 text-sm">
              {showBeds && (
                <span className="flex items-center gap-1.5">
                  <Bed className="w-4 h-4" />
                  {accommodation.beds} {t.beds}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Bath className="w-4 h-4" />
                {accommodation.bathrooms} {t.baths}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {accommodation.max_guests} {t.guests}
              </span>
              {accommodation.sqm && (
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  {accommodation.sqm} {t.sqm}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <p className="text-white/50 text-xs font-medium mb-0.5">{t.from}</p>
              <p className="text-white text-2xl font-bold leading-none">
                {currencySymbol} {price}
                <span className="text-white/60 text-sm font-normal ml-1">{priceSuffix}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-xl font-semibold text-sm group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              {t.viewDetails}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${(index % 3) * 80}ms, transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94) ${(index % 3) * 80}ms`,
      }}
    >
    <Link
      to={detailPath}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-400 border border-gray-100 hover:-translate-y-1 flex flex-col"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
        <img
          src={
            accommodation.thumbnail_url ||
            'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'
          }
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
        />
        {accommodation.is_featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <Star className="w-3.5 h-3.5 fill-current" />
            {t.featured}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-gray-400 font-medium">{t.from}</p>
            <p className="font-bold text-gray-900 text-base leading-tight">
              {currencySymbol} {price}
              <span className="text-gray-400 text-xs font-normal ml-0.5">{priceSuffix}</span>
            </p>
          </div>
        </div>

        {description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">{description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-400 mt-auto mb-4">
          {showBeds && (
            <span className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5" />
              {accommodation.beds} {t.beds}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5" />
            {accommodation.bathrooms} {t.baths}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {accommodation.max_guests} {t.guests}
          </span>
          {accommodation.sqm && (
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3" />
              {accommodation.sqm} {t.sqm}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-2.5 transition-all duration-200">
          {t.viewDetails}
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
    </div>
  );
}

export default function AccommodationsPage() {
  const { language } = useLanguage();
  const { accommodations, unitTypes, loading, error } = useAccommodations();
  const [filter, setFilter] = useState('all');
  const t = content[language];

  const dynamicFilters = [
    { key: 'all', label: language === 'EN' ? 'All' : 'Toate' },
    ...unitTypes.map(type => ({
      key: type.slug,
      label: language === 'EN' ? type.name_en : type.name_ro
    }))
  ];

  const filteredAccommodations = accommodations.filter((acc) => {
    if (filter === 'all') return true;
    return acc.unit_type === filter;
  });

  const hasMultipleTypes = unitTypes.length > 1;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/50 to-black/30" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-28 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-primary-light text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              {t.eyebrow}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 tracking-tight">
              {t.title}
            </h1>
            <p className="text-xl text-white/65 leading-relaxed max-w-lg">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#faf9f7] to-transparent" />
      </section>

      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          {hasMultipleTypes && (
            <div className="flex flex-wrap gap-2 mb-10">
              {dynamicFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : filteredAccommodations.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400">{t.noAccommodations}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccommodations.map((accommodation, idx) => (
                <AccommodationCard
                  key={accommodation.id}
                  accommodation={accommodation}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
