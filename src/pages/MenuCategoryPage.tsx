import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { usePrice } from '../hooks/usePrice';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { useSlugContext } from '../contexts/SlugContext';

interface Product {
  id: string;
  slug: string;
  slug_ro: string;
  title_en: string;
  title_ro: string;
  short_description_en: string;
  short_description_ro: string;
  base_price: number;
  image_url: string;
  is_minibar_item: boolean;
  is_popular: boolean;
  dietary_tags: string[];
}

interface Category {
  slug: string;
  slug_ro: string;
  name_en: string;
  name_ro: string;
  description_en: string;
  description_ro: string;
  is_minibar: boolean;
}

export default function MenuCategoryPage() {
  const { language } = useLanguage();
  const { menuPath, cartPath, getProductPath } = useLocalizedPath();
  const { setCurrentSlugPair } = useSlugContext();
  const { slug } = useParams();
  const { totalItems } = useCart();
  const { formatPrice } = usePrice();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .or(`slug.eq.${slug},slug_ro.eq.${slug}`)
        .eq('is_active', true)
        .maybeSingle();

      if (categoryData) {
        setCategory(categoryData);

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryData.id)
          .eq('is_available', true)
          .order('display_order');

        if (productsData) {
          setProducts(productsData);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (category) {
      setCurrentSlugPair({ slug: category.slug, slug_ro: category.slug_ro });
    }
    return () => setCurrentSlugPair(null);
  }, [category, setCurrentSlugPair]);

  const content = {
    RO: {
      back: 'Inapoi la Meniu',
      popular: 'Popular',
      from: 'de la',
      viewDetails: 'Vezi Detalii',
      nextDay: 'Livrare urmatoarea zi',
      available247: 'Disponibil 24/7',
      cart: 'Cos',
      notFound: 'Categorie negasita',
      noProducts: 'Nu exista produse in aceasta categorie.',
    },
    EN: {
      back: 'Back to Menu',
      popular: 'Popular',
      from: 'from',
      viewDetails: 'View Details',
      nextDay: 'Next-day delivery',
      available247: 'Available 24/7',
      cart: 'Cart',
      notFound: 'Category not found',
      noProducts: 'No products available in this category.',
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

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.notFound}</h2>
          <Link to={menuPath} className="text-primary hover:underline">
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to={menuPath}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {language === 'RO' ? category.name_ro : category.name_en}
              </h1>
              <p className="text-gray-600">
                {language === 'RO' ? category.description_ro : category.description_en}
              </p>
              <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {category.is_minibar ? t.available247 : t.nextDay}
              </span>
            </div>
            <Link
              to={cartPath}
              className="relative bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {t.cart}
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={getProductPath({ slug: product.slug, slug_ro: product.slug_ro })}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
            >
              {product.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={language === 'RO' ? product.title_ro : product.title_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {language === 'RO' ? product.title_ro : product.title_en}
                  </h3>
                  {product.is_popular && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                      {t.popular}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {language === 'RO' ? product.short_description_ro : product.short_description_en}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">
                    {t.from} {formatPrice(product.base_price)}
                  </span>
                  <span className="text-primary font-medium text-sm group-hover:underline">
                    {t.viewDetails} &rarr;
                  </span>
                </div>
                {product.dietary_tags && product.dietary_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.dietary_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">{t.noProducts}</p>
          </div>
        )}
      </div>
    </div>
  );
}
