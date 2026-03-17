import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShoppingBag, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';

interface Category {
  id: string;
  name_en: string;
  name_ro: string;
  slug: string;
  slug_ro: string;
  description_en: string;
  description_ro: string;
  is_minibar: boolean;
  requires_advance_order: boolean;
}

export default function MenuLandingPage() {
  const { language } = useLanguage();
  const { getCategoryPath } = useLocalizedPath();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    }
    fetchCategories();
  }, []);

  const foodCategories = categories.filter(c => !c.is_minibar);
  const minibarCategories = categories.filter(c => c.is_minibar);

  const content = {
    RO: {
      title: 'Meniu Digital',
      subtitle: 'Comanda mancare si bauturi direct in camera ta',
      importantNotice: 'Informatii Importante',
      foodNotice: 'Comenzile de mancare trebuie plasate cu 1 zi inainte',
      minibarNotice: 'Produsele mini-bar sunt disponibile 24/7',
      foodSection: 'Mancare',
      minibarSection: 'Mini-Bar',
      nextDay: 'Livrare urmatoarea zi',
      available247: 'Disponibil 24/7',
      viewMenu: 'Vezi Meniul',
    },
    EN: {
      title: 'Digital Menu',
      subtitle: 'Order food and beverages directly to your room',
      importantNotice: 'Important Notice',
      foodNotice: 'Food orders must be placed 1 day in advance',
      minibarNotice: 'Mini-bar items are available 24/7',
      foodSection: 'Food',
      minibarSection: 'Mini-Bar',
      nextDay: 'Next-day delivery',
      available247: 'Available 24/7',
      viewMenu: 'View Menu',
    },
  };

  const t = content[language];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>

        <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-primary-dark mb-2">{t.importantNotice}</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.foodNotice}
                </li>
                <li className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  {t.minibarNotice}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {foodCategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.foodSection}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodCategories.map((category) => (
                <Link
                  key={category.id}
                  to={getCategoryPath({ slug: category.slug, slug_ro: category.slug_ro })}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {language === 'RO' ? category.name_ro : category.name_en}
                      </h3>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {t.nextDay}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {language === 'RO' ? category.description_ro : category.description_en}
                    </p>
                    <span className="text-primary font-medium text-sm group-hover:underline">
                      {t.viewMenu} &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {minibarCategories.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.minibarSection}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {minibarCategories.map((category) => (
                <Link
                  key={category.id}
                  to={getCategoryPath({ slug: category.slug, slug_ro: category.slug_ro })}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {language === 'RO' ? category.name_ro : category.name_en}
                      </h3>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {t.available247}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {language === 'RO' ? category.description_ro : category.description_en}
                    </p>
                    <span className="text-primary font-medium text-sm group-hover:underline">
                      {t.viewMenu} &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
