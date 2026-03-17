import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, AlertCircle, Check } from 'lucide-react';
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
  category_id: string;
  title_en: string;
  title_ro: string;
  short_description_en: string;
  short_description_ro: string;
  full_description_en: string;
  full_description_ro: string;
  special_mentions_en: string;
  special_mentions_ro: string;
  ingredients_en: string;
  ingredients_ro: string;
  base_price: number;
  image_url: string;
  dietary_tags: string[];
  is_minibar_item: boolean;
}

interface Allergen {
  id: string;
  name_en: string;
  name_ro: string;
}

interface ProductSize {
  id: string;
  size_name_en: string;
  size_name_ro: string;
  price_modifier: number;
}

interface Category {
  name_en: string;
  name_ro: string;
  slug: string;
  slug_ro: string;
  is_minibar: boolean;
}

export default function ProductDetailPage() {
  const { language } = useLanguage();
  const { menuPath, cartPath } = useLocalizedPath();
  const { setCurrentSlugPair } = useSlugContext();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = usePrice();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .or(`slug.eq.${slug},slug_ro.eq.${slug}`)
        .eq('is_available', true)
        .maybeSingle();

      if (productData) {
        setProduct(productData);

        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', productData.category_id)
          .maybeSingle();

        if (categoryData) {
          setCategory(categoryData);
        }

        const { data: sizesData } = await supabase
          .from('product_sizes')
          .select('*')
          .eq('product_id', productData.id)
          .eq('is_available', true)
          .order('display_order');

        if (sizesData && sizesData.length > 0) {
          setSizes(sizesData);
          setSelectedSize(sizesData[0]);
        }

        const { data: allergenData } = await supabase
          .from('product_allergens')
          .select('allergens(id, name_en, name_ro)')
          .eq('product_id', productData.id);

        if (allergenData) {
          setAllergens(
            allergenData
              .map((pa: { allergens: Allergen | null }) => pa.allergens)
              .filter((a): a is Allergen => a !== null)
          );
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (product) {
      setCurrentSlugPair({ slug: product.slug, slug_ro: product.slug_ro });
    }
    return () => setCurrentSlugPair(null);
  }, [product, setCurrentSlugPair]);

  const currentPrice = product
    ? product.base_price + (selectedSize?.price_modifier || 0)
    : 0;

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      productTitleEn: product.title_en,
      productTitleRo: product.title_ro,
      sizeId: selectedSize?.id,
      sizeName: selectedSize
        ? language === 'RO'
          ? selectedSize.size_name_ro
          : selectedSize.size_name_en
        : undefined,
      quantity,
      unitPrice: currentPrice,
      imageUrl: product.image_url,
      isMinibar: product.is_minibar_item,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const content = {
    RO: {
      back: 'Inapoi',
      specialMentions: 'Mentiuni Speciale',
      allergens: 'Alergeni',
      ingredients: 'Ingrediente',
      selectSize: 'Selecteaza Marime',
      quantity: 'Cantitate',
      addToCart: 'Adauga in Cos',
      addedToCart: 'Adaugat!',
      viewCart: 'Vezi Cosul',
      fullDescription: 'Descriere Completa',
      dietary: 'Informatii Dietetice',
      nextDay: 'Livrare urmatoarea zi',
      available247: 'Disponibil 24/7',
      notFound: 'Produs negasit',
    },
    EN: {
      back: 'Back',
      specialMentions: 'Special Mentions',
      allergens: 'Allergens',
      ingredients: 'Ingredients',
      selectSize: 'Select Size',
      quantity: 'Quantity',
      addToCart: 'Add to Cart',
      addedToCart: 'Added!',
      viewCart: 'View Cart',
      fullDescription: 'Full Description',
      dietary: 'Dietary Information',
      nextDay: 'Next-day delivery',
      available247: 'Available 24/7',
      notFound: 'Product not found',
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

  if (!product || !category) {
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

  const title = language === 'RO' ? product.title_ro : product.title_en;
  const shortDesc = language === 'RO' ? product.short_description_ro : product.short_description_en;
  const fullDesc = language === 'RO' ? product.full_description_ro : product.full_description_en;
  const specialMentions = language === 'RO' ? product.special_mentions_ro : product.special_mentions_en;
  const ingredients = language === 'RO' ? product.ingredients_ro : product.ingredients_en;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square overflow-hidden bg-gray-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {category.is_minibar ? t.available247 : t.nextDay}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(currentPrice)}
                  </div>
                </div>
              </div>

              {specialMentions && (
                <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-primary-dark mb-1">{t.specialMentions}</h3>
                      <p className="text-gray-700 text-sm">{specialMentions}</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-700 text-lg mb-6">{shortDesc}</p>

              {sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    {t.selectSize}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {sizes.map((size) => {
                      const sizePrice = product.base_price + size.price_modifier;
                      const sizeName = language === 'RO' ? size.size_name_ro : size.size_name_en;
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            selectedSize?.id === size.id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{sizeName}</div>
                          <div className="text-sm text-gray-600">{formatPrice(sizePrice)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t.quantity}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2 font-semibold text-lg"
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t.addedToCart}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {t.addToCart}
                    </>
                  )}
                </button>
                <Link
                  to={cartPath}
                  className="px-6 py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-semibold"
                >
                  {t.viewCart}
                </Link>
              </div>

              {allergens.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">{t.allergens}</h3>
                  <div className="flex flex-wrap gap-2">
                    {allergens.map((allergen) => (
                      <span
                        key={allergen.id}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
                      >
                        {language === 'RO' ? allergen.name_ro : allergen.name_en}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.dietary_tags && product.dietary_tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t.dietary}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.dietary_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {fullDesc && (
            <div className="p-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.fullDescription}</h2>
              <p className="text-gray-700 leading-relaxed">{fullDesc}</p>

              {ingredients && (
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-900 mb-2">{t.ingredients}</h3>
                  <p className="text-amber-800 leading-relaxed">{ingredients}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
