import { useState, useEffect } from 'react';
import { Home, Users, Bed, Calendar, Calculator, LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Price from './Price';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuote } from '../contexts/QuoteContext';
import { supabase } from '../lib/supabase';

interface RentalOption {
  id: string;
  slug: string;
  icon: string;
  title_en: string;
  title_ro: string;
  description_en: string;
  description_ro: string;
  features_en: string[];
  features_ro: string[];
  price_daily: number;
  price_weekly: number;
  price_monthly: number;
  price_yearly: number;
  display_order: number;
}

const iconMap: Record<string, LucideIcon> = {
  Home,
  Users,
  Bed,
  Calendar,
};

const getIcon = (iconName: string): LucideIcon => {
  if (iconMap[iconName]) return iconMap[iconName];
  const icon = (LucideIcons as Record<string, LucideIcon>)[iconName];
  return icon || Home;
};

const defaultOptions: RentalOption[] = [
  {
    id: '1',
    slug: 'complete',
    icon: 'Home',
    title_en: 'Complete Property',
    title_ro: 'Proprietate Completă',
    description_en: 'Entire property with all facilities',
    description_ro: 'Întreaga proprietate cu toate facilitățile',
    features_en: ['12 rooms', '6 bathrooms', 'Private garden', 'Parking'],
    features_ro: ['12 camere', '6 băi', 'Grădină privată', 'Parcare'],
    price_daily: 350,
    price_weekly: 2200,
    price_monthly: 8600,
    price_yearly: 92880,
    display_order: 0,
  },
  {
    id: '2',
    slug: 'floors',
    icon: 'Users',
    title_en: 'Floor-by-Floor',
    title_ro: 'Etaj cu Etaj',
    description_en: 'Separate rental for each level',
    description_ro: 'Închiriere separată pentru fiecare nivel',
    features_en: ['6 rooms/floor', '3 bathrooms/floor', 'Separate access', 'Private areas'],
    features_ro: ['6 camere/etaj', '3 băi/etaj', 'Acces separat', 'Spații private'],
    price_daily: 150,
    price_weekly: 945,
    price_monthly: 3700,
    price_yearly: 39900,
    display_order: 1,
  },
  {
    id: '3',
    slug: 'rooms',
    icon: 'Bed',
    title_en: 'Individual Rooms',
    title_ro: 'Camere Individuale',
    description_en: 'Room rental with shared facilities',
    description_ro: 'Închiriere pe camere cu facilități comune',
    features_en: ['1 room', 'Shared bathroom', 'Shared kitchen', 'Common areas'],
    features_ro: ['1 cameră', 'Baie comună', 'Bucătărie comună', 'Spații comune'],
    price_daily: 25,
    price_weekly: 155,
    price_monthly: 615,
    price_yearly: 6640,
    display_order: 2,
  },
  {
    id: '4',
    slug: 'outdoor',
    icon: 'Calendar',
    title_en: 'Outdoor Space',
    title_ro: 'Spațiu Exterior',
    description_en: 'Garden and courtyard for events',
    description_ro: 'Grădina și curtea pentru evenimente',
    features_en: ['Private garden', 'Pizza oven', 'Event spaces', 'Parking'],
    features_ro: ['Grădină privată', 'Cuptor pizza', 'Spații evenimente', 'Parcare'],
    price_daily: 200,
    price_weekly: 1260,
    price_monthly: 4900,
    price_yearly: 52900,
    display_order: 3,
  },
];

export default function RentalOptions() {
  const { language } = useLanguage();
  const { setQuoteRequest } = useQuote();
  const [options, setOptions] = useState<RentalOption[]>(defaultOptions);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [duration, setDuration] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (options.length > 0 && !selectedOption) {
      setSelectedOption(options[0].slug);
    }
  }, [options, selectedOption]);

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_options')
        .select('*')
        .eq('is_visible', true)
        .order('display_order');

      if (error) throw error;
      if (data && data.length > 0) {
        setOptions(data);
        setSelectedOption(data[0].slug);
      }
    } catch (error) {
      console.error('Error fetching rental options:', error);
    } finally {
      setLoading(false);
    }
  };

  const configurationMap: Record<string, { EN: string; RO: string }> = {};
  options.forEach((opt) => {
    configurationMap[opt.slug] = { EN: opt.title_en, RO: opt.title_ro };
  });

  const periodMap: Record<string, { EN: string; RO: string }> = {
    daily: { EN: 'A few days', RO: 'Câteva zile' },
    weekly: { EN: 'One week', RO: 'O săptămână' },
    monthly: { EN: '1-3 months', RO: '1-3 luni' },
    yearly: { EN: 'Over 1 year', RO: 'Peste 1 an' },
  };

  const handleRequestQuote = () => {
    const configuration = configurationMap[selectedOption]?.[language] || '';
    const rentalPeriod = periodMap[duration]?.[language] || '';

    setQuoteRequest({ configuration, rentalPeriod });

    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const content = {
    RO: {
      title: 'Opțiuni de Închiriere',
      subtitle: 'Configurații flexibile pentru nevoile dumneavoastră',
      calculator: 'Calculator Preț',
      duration: {
        daily: 'Zilnic',
        weekly: 'Săptămânal',
        monthly: 'Lunar',
        yearly: 'Anual',
      },
    },
    EN: {
      title: 'Rental Options',
      subtitle: 'Flexible configurations for your needs',
      calculator: 'Price Calculator',
      duration: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
      },
    },
  };

  const selectedOptionData = options.find((opt) => opt.slug === selectedOption);

  const getPrice = (opt: RentalOption, dur: string): number => {
    switch (dur) {
      case 'daily':
        return opt.price_daily;
      case 'weekly':
        return opt.price_weekly;
      case 'monthly':
        return opt.price_monthly;
      case 'yearly':
        return opt.price_yearly;
      default:
        return opt.price_monthly;
    }
  };

  if (loading) {
    return (
      <section id="pricing" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <section id="pricing" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            {content[language].title}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            {content[language].subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <div className="space-y-4 sm:space-y-6">
            {options.map((option) => {
              const IconComponent = getIcon(option.icon);
              const title = language === 'RO' ? option.title_ro : option.title_en;
              const description = language === 'RO' ? option.description_ro : option.description_en;
              const features = language === 'RO' ? option.features_ro : option.features_en;

              return (
                <div
                  key={option.id}
                  className={`p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 active:scale-[0.98] ${selectedOption === option.slug
                      ? 'bg-primary text-white shadow-xl'
                      : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  onClick={() => setSelectedOption(option.slug)}
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] sm:min-w-[48px] rounded-xl flex items-center justify-center ${selectedOption === option.slug ? 'bg-white/20' : 'bg-primary/10'
                        }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${selectedOption === option.slug ? 'text-white' : 'text-primary'
                          }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{title}</h3>
                      <p
                        className={`mb-3 sm:mb-4 text-sm sm:text-base ${selectedOption === option.slug ? 'text-white/90' : 'text-gray-600'
                          }`}
                      >
                        {description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {features.map((feature, index) => (
                          <span
                            key={index}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${selectedOption === option.slug
                                ? 'bg-white/20 text-white'
                                : 'bg-primary/10 text-primary'
                              }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {content[language].calculator}
              </h3>
            </div>

            <div className="mb-6 sm:mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {language === 'RO' ? 'Perioada închirierii' : 'Rental period'}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(content[language].duration).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setDuration(key)}
                    className={`p-3 min-h-[48px] rounded-lg font-medium transition-colors text-sm sm:text-base ${duration === key
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {selectedOptionData && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {language === 'RO' ? selectedOptionData.title_ro : selectedOptionData.title_en}
                  </h4>
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-3 sm:mb-4 flex flex-col items-center gap-2">
                    <Price
                      amount={getPrice(selectedOptionData, duration)}
                      size="xl"
                      showConversionBadge={true}
                    />
                  </div>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    {content[language].duration[duration as keyof typeof content.EN.duration]}
                  </p>
                  <button
                    onClick={handleRequestQuote}
                    className="w-full bg-primary text-white py-3 min-h-[48px] rounded-lg font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all"
                  >
                    {language === 'RO' ? 'Solicită Ofertă' : 'Request Quote'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
