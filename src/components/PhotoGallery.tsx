import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useScrollReveal, useStaggeredReveal } from '../hooks/useScrollReveal';

interface GalleryImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ro: string | null;
}

const SLIDE_DURATION = 300;

const PhotoGallery: React.FC = () => {
  const { language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedIndex, setDisplayedIndex] = useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      const { data } = await supabase
        .from('media_library')
        .select('id, url, alt_text_en, alt_text_ro')
        .ilike('folder', 'gallery')
        .eq('type', 'image')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setGalleryImages(data);
      }
      setLoading(false);
    };
    fetchGalleryImages();
  }, []);

  const content = {
    RO: {
      title: 'Galerie Foto',
      subtitle: 'Explorează spațiile și facilitățile proprietății',
    },
    EN: {
      title: 'Photo Gallery',
      subtitle: 'Explore the spaces and facilities of the property',
    }
  };

  const fallbackImages = [
    { src: '/20130615_210207.jpg', alt: 'Street View' },
    { src: '/20150101_151813.jpg', alt: 'Winter Garden' },
    { src: '/20150605_143858848_iOS.jpg', alt: 'Property Building' },
    { src: '/bd04284c_original.jpg', alt: 'Bathroom' },
    { src: '/FullSizeRender.jpg', alt: 'Jacuzzi Bath' },
    { src: '/IMAG0083.jpg', alt: 'Property Courtyard' },
    { src: '/IMAG0088.jpg', alt: 'Property Side View' },
    { src: '/IMAG0090.jpg', alt: 'Street Front View' },
    { src: '/IMAG0091.jpg', alt: 'Winter Garden Evening' },
    { src: '/IMG_0132.JPG', alt: 'Snowy Garden View' },
    { src: '/IMG_20160206_130215~2.jpg', alt: 'Interior Staircase' },
    { src: '/IMG_20200616_111734.jpg', alt: 'Garden Lawn Area' }
  ];

  const displayImages = galleryImages.length > 0
    ? galleryImages.map(img => ({
        src: img.url,
        alt: language === 'RO' ? (img.alt_text_ro || 'Gallery image') : (img.alt_text_en || 'Gallery image')
      }))
    : fallbackImages;

  const { ref: gridRef, visibleCount } = useStaggeredReveal(displayImages.length, { threshold: 0.05 });

  const openImage = (index: number) => {
    setDisplayedIndex(index);
    setSelectedImage(index);
    setSlideDir(null);
  };

  const navigateTo = useCallback((nextIndex: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDir(dir);
    setTimeout(() => {
      setDisplayedIndex(nextIndex);
      setSelectedImage(nextIndex);
      setSlideDir(null);
      setIsAnimating(false);
    }, SLIDE_DURATION);
  }, [isAnimating]);

  const nextImage = useCallback(() => {
    if (selectedImage === null) return;
    navigateTo((selectedImage + 1) % displayImages.length, 'left');
  }, [selectedImage, displayImages.length, navigateTo]);

  const prevImage = useCallback(() => {
    if (selectedImage === null) return;
    navigateTo(selectedImage === 0 ? displayImages.length - 1 : selectedImage - 1, 'right');
  }, [selectedImage, displayImages.length, navigateTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedImage, nextImage, prevImage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    dragX.current = 0;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) return;
    isDragging.current = true;
    dragX.current = dx;
    setDragOffset(dx);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = dragX.current;
    setDragOffset(0);
    if (Math.abs(delta) > 60) {
      delta < 0 ? nextImage() : prevImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    dragX.current = 0;
    isDragging.current = false;
  };

  const getSlideStyle = (): React.CSSProperties => {
    if (dragOffset !== 0 && !isAnimating) {
      return {
        transform: `translateX(${dragOffset}px)`,
        transition: 'none',
      };
    }
    if (slideDir === 'left') {
      return {
        transform: 'translateX(-100%)',
        opacity: 0,
        transition: `transform ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.2,1), opacity ${SLIDE_DURATION}ms ease`,
      };
    }
    if (slideDir === 'right') {
      return {
        transform: 'translateX(100%)',
        opacity: 0,
        transition: `transform ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.2,1), opacity ${SLIDE_DURATION}ms ease`,
      };
    }
    return {
      transform: 'translateX(0)',
      opacity: 1,
      transition: `transform ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.2,1), opacity ${SLIDE_DURATION}ms ease`,
    };
  };

  return (
    <section id="gallery" className="py-12 md:py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          ref={headerRef}
          className={`text-center mb-8 md:mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            {content[language].title}
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
            {content[language].subtitle}
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
          {displayImages.map((image, index) => {
            const isItemVisible = index < visibleCount;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded cursor-pointer aspect-square"
                onClick={() => openImage(index)}
                style={{
                  opacity: isItemVisible ? 1 : 0,
                  transform: isItemVisible ? 'scale(1)' : 'scale(0.92)',
                  transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedImage !== null && displayedIndex !== null && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-white hover:text-gray-300 transition-colors z-10 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm"
              aria-label="Close"
            >
              <X size={24} />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-white hover:text-gray-300 transition-colors z-10 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-white hover:text-gray-300 transition-colors z-10 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <img
                key={displayedIndex}
                src={displayImages[displayedIndex].src}
                alt={displayImages[displayedIndex].alt}
                className="max-w-full max-h-[85vh] object-contain select-none"
                draggable={false}
                style={getSlideStyle()}
              />
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
              <div className="text-white/60 text-sm">
                {selectedImage + 1} / {displayImages.length}
              </div>
              <div className="flex gap-1">
                {displayImages.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === selectedImage
                        ? 'w-4 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PhotoGallery;
