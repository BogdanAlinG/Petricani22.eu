import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import PropertyStickyNav from '../components/PropertyStickyNav';
import {
  Bed,
  Bath,
  Users,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Clock,
  Share2,
  Heart,
  Loader,
  ExternalLink,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAccommodation, useHouseRules, usePointsOfInterest } from '../hooks/useAccommodations';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { useSlugContext } from '../contexts/SlugContext';
import BookingWidget from '../components/booking/BookingWidget';
import GoogleMap from '../components/GoogleMap';

const content = {
  EN: {
    back: 'Back to Accommodations',
    beds: 'beds',
    baths: 'baths',
    guests: 'guests',
    sqm: 'sqm',
    about: 'About this space',
    amenities: 'What this place offers',
    showAll: 'Show all amenities',
    houseRules: 'House Rules',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    location: 'Location',
    nearbyPlaces: 'Nearby Places',
    shareTitle: 'Share this accommodation',
    saveTitle: 'Save to wishlist',
    notFound: 'Accommodation not found',
    loading: 'Loading...',
    viewOnMap: 'View on map',
  },
  RO: {
    back: 'Înapoi la Cazări',
    beds: 'paturi',
    baths: 'băi',
    guests: 'oaspeți',
    sqm: 'mp',
    about: 'Despre acest spațiu',
    amenities: 'Ce oferă această locație',
    showAll: 'Arată toate facilitățile',
    houseRules: 'Regulile Casei',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    location: 'Locație',
    nearbyPlaces: 'Locuri din Apropiere',
    shareTitle: 'Distribuie această cazare',
    saveTitle: 'Salvează în lista de dorințe',
    notFound: 'Cazarea nu a fost găsită',
    loading: 'Se încarcă...',
    viewOnMap: 'Vezi pe hartă',
  },
};

type SlideDirection = 'left' | 'right' | null;

function ImageGallery({
  images,
  thumbnailUrl,
}: {
  images: { image_url: string; alt_text_en: string; alt_text_ro: string }[];
  thumbnailUrl: string | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<SlideDirection>(null);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allImages = React.useMemo(() => {
    const galleryItems = [...images];
    
    // Add thumbnail as the first image if it exists and isn't already in the gallery
    if (thumbnailUrl && !galleryItems.some(img => img.image_url === thumbnailUrl)) {
      galleryItems.unshift({
        image_url: thumbnailUrl,
        alt_text_en: 'Accommodation',
        alt_text_ro: 'Cazare',
      });
    }

    return galleryItems.length > 0
      ? galleryItems
      : [
          {
            image_url:
              'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200',
            alt_text_en: 'Accommodation',
            alt_text_ro: 'Cazare',
          },
        ];
  }, [images, thumbnailUrl]);

  const navigate = (nextIndex: number, dir: SlideDirection) => {
    if (animating) return;
    setPrevIndex(currentIndex);
    setDirection(dir);
    setAnimating(true);
    setCurrentIndex(nextIndex);
    if (animationTimer.current) clearTimeout(animationTimer.current);
    animationTimer.current = setTimeout(() => {
      setPrevIndex(null);
      setAnimating(false);
    }, 420);
  };

  const goToPrev = () => {
    navigate(currentIndex === 0 ? allImages.length - 1 : currentIndex - 1, 'right');
  };

  const goToNext = () => {
    navigate(currentIndex === allImages.length - 1 ? 0 : currentIndex + 1, 'left');
  };

  const goToIndex = (idx: number) => {
    if (idx === currentIndex) return;
    navigate(idx, idx > currentIndex ? 'left' : 'right');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? goToNext() : goToPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const getIncomingStyle = (dir: SlideDirection): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    animation: dir === 'left'
      ? 'slideInFromRight 0.42s cubic-bezier(0.25,0.46,0.45,0.94) forwards'
      : 'slideInFromLeft 0.42s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
  });

  const getOutgoingStyle = (dir: SlideDirection): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    animation: dir === 'left'
      ? 'slideOutToLeft 0.42s cubic-bezier(0.25,0.46,0.45,0.94) forwards'
      : 'slideOutToRight 0.42s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
  });

  return (
    <div className="select-none">
      <div
        className="relative w-full h-[320px] md:h-[520px] bg-gray-900 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {animating && prevIndex !== null && (
          <img
            src={allImages[prevIndex].image_url}
            alt=""
            style={getOutgoingStyle(direction)}
            className="w-full h-full object-cover"
          />
        )}

        <img
          src={allImages[currentIndex].image_url}
          alt=""
          style={animating ? getIncomingStyle(direction) : {}}
          className="w-full h-full object-cover"
        />

        {allImages.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-5 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="relative bg-gray-100">
          <div className="flex overflow-x-auto gap-1 p-1 scrollbar-hide">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`flex-shrink-0 w-[190px] h-[120px] overflow-hidden transition-opacity duration-200 ${
                  idx === currentIndex
                    ? 'opacity-100 ring-2 ring-primary ring-offset-1'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function AmenityIcon({ iconName }: { iconName: string }) {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Check;
  return <Icon className="w-5 h-5" />;
}

export default function AccommodationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { accommodation, images, loading, error } = useAccommodation(slug || '');
  const { rules } = useHouseRules();
  const { pois } = usePointsOfInterest();
  const { accommodationsPath } = useLocalizedPath();
  const { setCurrentSlugPair } = useSlugContext();
  const { goBack } = useNavigation();
  const navigate = useNavigate();
  const backPath = accommodationsPath;
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const t = content[language];

  const handleBack = () => {
    goBack();
    navigate(backPath);
  };


  useEffect(() => {
    if (accommodation) {
      setCurrentSlugPair({ slug: accommodation.slug, slug_ro: accommodation.slug_ro });
    }
    return () => setCurrentSlugPair(null);
  }, [accommodation, setCurrentSlugPair]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{t.notFound}</p>
        <Link to={backPath} className="text-primary hover:underline">
          {t.back}
        </Link>
      </div>
    );
  }

  const title = language === 'EN' ? accommodation.title_en : accommodation.title_ro;
  const description =
    language === 'EN' ? accommodation.description_en : accommodation.description_ro;

  const amenitiesByCategory = (accommodation.amenities || []).reduce(
    (acc, link) => {
      const categoryName =
        language === 'EN'
          ? link.amenity.category?.name_en || 'Other'
          : link.amenity.category?.name_ro || 'Altele';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(link);
      return acc;
    },
    {} as Record<string, typeof accommodation.amenities>
  );

  const displayedAmenities = showAllAmenities
    ? amenitiesByCategory
    : Object.fromEntries(
        Object.entries(amenitiesByCategory).map(([cat, items]) => [cat, items?.slice(0, 4)])
      );

  const totalAmenities = accommodation.amenities?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      <PropertyStickyNav />

      <div id="property" className="container mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {t.back}
          </button>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title={t.shareTitle}
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title={t.saveTitle}
            >
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div id="gallery">
        <ImageGallery images={images} thumbnailUrl={accommodation.thumbnail_url} />
      </div>

      <div className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{title}</h1>

              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5" />
                  <span>
                    {accommodation.beds} {t.beds}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5" />
                  <span>
                    {accommodation.bathrooms} {t.baths}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>
                    {accommodation.max_guests} {t.guests}
                  </span>
                </div>
                {accommodation.sqm && (
                  <div className="flex items-center gap-2">
                    <Maximize className="w-5 h-5" />
                    <span>
                      {accommodation.sqm} {t.sqm}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.about}</h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                {description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            {totalAmenities > 0 && (
              <div
                id="amenities"
                className="border-t border-gray-200 pt-10"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.amenities}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(displayedAmenities).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                      <div className="space-y-3">
                        {items?.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center gap-3 text-gray-600"
                          >
                            <AmenityIcon iconName={link.amenity.icon} />
                            <span>
                              {language === 'EN'
                                ? link.amenity.name_en
                                : link.amenity.name_ro}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {totalAmenities > 8 && !showAllAmenities && (
                  <button
                    onClick={() => setShowAllAmenities(true)}
                    className="mt-6 px-6 py-3 border border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    {t.showAll} ({totalAmenities})
                  </button>
                )}
              </div>
            )}

            {rules.length > 0 && (
              <div
                className="border-t border-gray-200 pt-10"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.houseRules}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">{t.checkIn}</div>
                      <div className="text-gray-600">
                        {accommodation.check_in_time || '15:00'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">{t.checkOut}</div>
                      <div className="text-gray-600">
                        {accommodation.check_out_time || '11:00'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <AmenityIcon iconName={rule.icon} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {language === 'EN' ? rule.title_en : rule.title_ro}
                        </div>
                        <div className="text-sm text-gray-600">
                          {language === 'EN' ? rule.description_en : rule.description_ro}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              id="location"
              className="border-t border-gray-200 pt-10"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.location}</h2>

              <div className="rounded-xl overflow-hidden h-[400px] mb-6">
                <GoogleMap language={language} />
              </div>

              {pois.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">{t.nearbyPlaces}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pois.map((poi) => (
                      <div
                        key={poi.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <AmenityIcon iconName={poi.icon} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {language === 'EN' ? poi.name_en : poi.name_ro}
                            </div>
                            {poi.distance_text && (
                              <div className="text-xs text-gray-500">
                                {poi.distance_text}
                                {poi.travel_time && ` · ${poi.travel_time}`}
                              </div>
                            )}
                          </div>
                        </div>
                        {poi.google_maps_url && (
                          <a
                            href={poi.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            id="pricing"
            className="lg:col-span-1"
          >
            <div className="sticky top-24">
              <BookingWidget accommodation={accommodation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
