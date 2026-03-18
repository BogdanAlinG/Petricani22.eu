import React, { useState, useEffect } from 'react';
import { Calculator, Check, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
import Price from './Price';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
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
}

interface UnitPriceCalculatorProps {
  unitSlug: string;
  showContactLink?: boolean;
}

const getIcon = (iconName: string): React.ElementType => {
  const icon = (LucideIcons as any)[iconName];
  return icon || LucideIcons.Home;
};

const UnitPriceCalculator: React.FC<UnitPriceCalculatorProps> = ({ unitSlug, showContactLink = true }) => {
  const { language, t } = useLanguage();
  const { getAccommodationPath, accommodationsPath, homePath } = useLocalizedPath();
  const [option, setOption] = useState<RentalOption | null>(null);
  const [accommodation, setAccommodation] = useState<{ slug: string; slug_ro: string } | null>(null);
  const [duration, setDuration] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOption = async () => {
      try {
        setLoading(true);
        const [optionRes, accRes] = await Promise.all([
          supabase
            .from('rental_options')
            .select('*')
            .eq('slug', unitSlug)
            .single(),
          supabase
            .from('accommodations')
            .select('slug, slug_ro')
            .or(`slug.eq."${unitSlug}",slug_ro.eq."${unitSlug}"`)
            .maybeSingle()
        ]);
 
        if (optionRes.error) throw optionRes.error;
        setOption(optionRes.data);
        if (accRes.data) {
          setAccommodation(accRes.data);
        }
      } catch (error) {
        console.error('Error fetching unit for calculator:', error);
      } finally {
        setLoading(false);
      }
    };

    if (unitSlug) {
      fetchOption();
    }
  }, [unitSlug]);


  const getPrice = (opt: RentalOption, dur: string): number => {
    switch (dur) {
      case 'daily': return opt.price_daily;
      case 'weekly': return opt.price_weekly;
      case 'monthly': return opt.price_monthly;
      case 'yearly': return opt.price_yearly;
      default: return opt.price_monthly;
    }
  };

  const durationLabels = {
    daily: t('Zilnic', 'Daily'),
    weekly: t('Saptamanal', 'Weekly'),
    monthly: t('Lunar', 'Monthly'),
    yearly: t('Anual', 'Yearly'),
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center min-h-[300px] animate-pulse">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!option) return null;

  const IconComponent = getIcon(option.icon);
  const title = language === 'RO' ? option.title_ro : option.title_en;
  const description = language === 'RO' ? option.description_ro : option.description_en;
  const features = language === 'RO' ? option.features_ro : option.features_en;

  return (
    <div className="my-12 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* Unit Info Section */}
        <div className="md:col-span-2 bg-primary p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <p className="text-white/80 mb-8 leading-relaxed">
            {description}
          </p>
          <div className="space-y-3">
            {features.slice(0, 4).map((feature, i) => (
              <div key={i} className="flex items-center space-x-3 text-sm font-medium">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing/Calculator Section */}
        <div className="md:col-span-3 p-8 bg-white">
          <div className="flex items-center space-x-3 mb-8">
            <Calculator className="w-6 h-6 text-primary" />
            <h4 className="text-xl font-bold text-gray-900">{t('Calculator Preț', 'Price Calculator')}</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {Object.entries(durationLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDuration(key)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  duration === key 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 text-center mb-8 border border-gray-100">
            <div className="flex flex-col items-center">
              <Price 
                amount={getPrice(option, duration)} 
                size="xl" 
                showConversionBadge={true} 
              />
              <p className="text-gray-500 mt-2 font-medium capitalize">
                {durationLabels[duration as keyof typeof durationLabels]}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={accommodation 
                ? getAccommodationPath({ slug: accommodation.slug, slug_ro: accommodation.slug_ro })
                : accommodationsPath
              }
              className="flex-1 bg-primary text-white h-12 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
            >
              <span>{t('Rezervă Acum', 'Book Now')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {showContactLink && (
              <Link
                to={`${homePath}#contact`}
                className="px-6 h-12 rounded-xl border-2 border-gray-100 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                {t('Contact', 'Contact')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitPriceCalculator;
