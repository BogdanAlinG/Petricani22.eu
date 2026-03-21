import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { throttle } from '../lib/utils';

interface HeroImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ro: string | null;
}

interface HeroCMS {
  title_en: string | null;
  title_ro: string | null;
  subtitle_en: string | null;
  subtitle_ro: string | null;
  settings: Record<string, string>;
}

const DEFAULTS = {
  RO: {
    title: 'Închiriere Proprietate în București',
    subtitle: 'Configurații flexibile pentru spații rezidențiale, comerciale sau evenimente',
    cta1: 'Solicită Ofertă Personalizată',
    cta2: 'Programează Vizionare',
  },
  EN: {
    title: 'Property Rental in Bucharest',
    subtitle: 'Flexible configurations for residential, commercial, or event spaces',
    cta1: 'Request Custom Offer',
    cta2: 'Schedule Viewing',
  },
};

const Hero: React.FC = () => {
  const { language } = useLanguage();
  const [heroImage, setHeroImage] = useState<HeroImage | null>(null);
  const [cms, setCms] = useState<HeroCMS | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHeroImage = async () => {
      const { data } = await supabase
        .from('media_library')
        .select('id, url, alt_text_en, alt_text_ro')
        .ilike('folder', 'hero')
        .eq('type', 'image')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setHeroImage(data);
    };

    const fetchCMS = async () => {
      const { data } = await supabase
        .from('page_sections')
        .select('title_en, title_ro, subtitle_en, subtitle_ro, settings')
        .eq('page', 'home')
        .eq('section', 'hero')
        .maybeSingle();

      if (data) setCms(data as HeroCMS);
    };

    fetchHeroImage();
    fetchCMS();

    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = throttle(() => setScrollY(window.scrollY), 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lang = language === 'RO' ? 'RO' : 'EN';
  const title =
    (lang === 'RO' ? cms?.title_ro : cms?.title_en) || DEFAULTS[lang].title;
  const subtitle =
    (lang === 'RO' ? cms?.subtitle_ro : cms?.subtitle_en) || DEFAULTS[lang].subtitle;
  const cta1 =
    (lang === 'RO' ? cms?.settings?.cta1_ro : cms?.settings?.cta1_en) || DEFAULTS[lang].cta1;
  const cta2 =
    (lang === 'RO' ? cms?.settings?.cta2_ro : cms?.settings?.cta2_en) || DEFAULTS[lang].cta2;

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const parallaxOffset = scrollY * 0.45;
  const videoUrl = cms?.settings?.video_url as string | undefined;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 parallax-bg" ref={bgRef}>
        {videoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : heroImage ? (
          <img
            src={heroImage.url}
            alt={language === 'RO' ? (heroImage.alt_text_ro || 'Hero image') : (heroImage.alt_text_en || 'Hero image')}
            className="w-full object-cover"
            style={{
              height: 'calc(100% + 200px)',
              marginTop: '-100px',
              transform: `translateY(${parallaxOffset}px)`,
              transition: 'transform 0.05s linear',
            }}
          />
        ) : (
          <img
            src="IMAG0090.jpg"
            alt="Property Exterior"
            className="w-full object-cover"
            style={{
              height: 'calc(100% + 200px)',
              marginTop: '-100px',
              transform: `translateY(${parallaxOffset}px)`,
              transition: 'transform 0.05s linear',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center text-white pt-16">
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-block mb-4 sm:mb-6"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: '0.1s',
            }}
          >
            <span className="px-4 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm font-medium tracking-widest uppercase">
              Petricani 22 · Bucharest
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
              filter: loaded ? 'blur(0px)' : 'blur(4px)',
              transition: 'opacity 1s cubic-bezier(0.22,1,0.36,1), transform 1s cubic-bezier(0.22,1,0.36,1), filter 1s cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: '0.25s',
            }}
          >
            {title}
          </h1>

          <p
            className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2"
            style={{
              opacity: loaded ? 0.9 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: '0.45s',
            }}
          >
            {subtitle}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: '0.65s',
            }}
          >
            <button
              onClick={scrollToContact}
              className="group w-full sm:w-auto bg-primary text-white px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 min-h-[52px] shadow-lg hover:shadow-2xl"
            >
              <Calendar size={20} className="group-hover:rotate-6 transition-transform duration-300" />
              <span>{cta1}</span>
            </button>
            <button
              onClick={scrollToContact}
              className="group w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-white/25 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 border border-white/30 min-h-[52px] hover:border-white/60"
            >
              <Eye size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <span>{cta2}</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block"
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.8s ease',
          transitionDelay: '1.2s',
        }}
      >
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center animate-bounce">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
