import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Search,
  ChevronDown,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageSelector from '../../components/admin/ImageSelector';
import AIGenerateButton from '../../components/admin/AIGenerateButton';
import { useAIGenerate } from '../../hooks/useAIGenerate';
import { useToast } from '../../components/ui/Toast';

interface Category {
  id: string;
  name_en: string;
  name_ro: string;
}

interface Allergen {
  id: string;
  name_en: string;
  name_ro: string;
  display_order: number;
}

interface ProductSize {
  id: string;
  size_name_en: string;
  size_name_ro: string;
  price_modifier: number;
  is_available: boolean;
  display_order: number;
}

interface Product {
  id: string;
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
  is_available: boolean;
  is_popular: boolean;
  display_order: number;
  categories?: Category;
}

interface ProductForm {
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
  base_price: string;
  image_url: string;
  dietary_tags: string;
  is_minibar_item: boolean;
  is_available: boolean;
  is_popular: boolean;
}

const emptyForm: ProductForm = {
  category_id: '',
  title_en: '',
  title_ro: '',
  short_description_en: '',
  short_description_ro: '',
  full_description_en: '',
  full_description_ro: '',
  special_mentions_en: '',
  special_mentions_ro: '',
  ingredients_en: '',
  ingredients_ro: '',
  base_price: '',
  image_url: '',
  dietary_tags: '',
  is_minibar_item: false,
  is_available: true,
  is_popular: false,
};

export default function ProductsManagement() {
  const toast = useToast();
  const { generate, generating } = useAIGenerate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [sizes, setSizes] = useState<Omit<ProductSize, 'id'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchAllergens();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, categories(id, name_en, name_ro)')
      .order('display_order', { ascending: true });

    if (data) {
      setProducts(data);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name_en, name_ro')
      .order('display_order', { ascending: true });

    if (data) {
      setCategories(data);
    }
  }

  async function fetchAllergens() {
    const { data } = await supabase
      .from('allergens')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) {
      setAllergens(data);
    }
  }

  async function fetchProductAllergens(productId: string) {
    const { data } = await supabase
      .from('product_allergens')
      .select('allergen_id')
      .eq('product_id', productId);

    if (data) {
      setSelectedAllergenIds(data.map((pa: { allergen_id: string }) => pa.allergen_id));
    } else {
      setSelectedAllergenIds([]);
    }
  }

  function toggleAllergen(allergenId: string) {
    setSelectedAllergenIds((prev) =>
      prev.includes(allergenId)
        ? prev.filter((id) => id !== allergenId)
        : [...prev, allergenId]
    );
  }

  async function fetchProductSizes(productId: string) {
    const { data } = await supabase
      .from('product_sizes')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (data) {
      setSizes(
        data.map((s: any) => ({
          size_name_en: s.size_name_en,
          size_name_ro: s.size_name_ro,
          price_modifier: s.price_modifier,
          is_available: s.is_available,
          display_order: s.display_order,
        }))
      );
    }
  }

  function openCreateModal() {
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' });
    setSizes([]);
    setSelectedAllergenIds([]);
    setEditingId(null);
    setError('');
    setShowModal(true);
  }

  async function openEditModal(product: Product) {
    setForm({
      category_id: product.category_id,
      title_en: product.title_en,
      title_ro: product.title_ro,
      short_description_en: product.short_description_en || '',
      short_description_ro: product.short_description_ro || '',
      full_description_en: product.full_description_en || '',
      full_description_ro: product.full_description_ro || '',
      special_mentions_en: product.special_mentions_en || '',
      special_mentions_ro: product.special_mentions_ro || '',
      ingredients_en: product.ingredients_en || '',
      ingredients_ro: product.ingredients_ro || '',
      base_price: String(product.base_price),
      image_url: product.image_url || '',
      dietary_tags: (product.dietary_tags || []).join(', '),
      is_minibar_item: product.is_minibar_item,
      is_available: product.is_available,
      is_popular: product.is_popular,
    });
    setEditingId(product.id);
    setError('');
    await Promise.all([fetchProductSizes(product.id), fetchProductAllergens(product.id)]);
    setShowModal(true);
  }

  function addSize() {
    setSizes([
      ...sizes,
      {
        size_name_en: '',
        size_name_ro: '',
        price_modifier: 0,
        is_available: true,
        display_order: sizes.length,
      },
    ]);
  }

  function updateSize(index: number, field: string, value: string | number | boolean) {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    setSizes(updated);
  }

  function removeSize(index: number) {
    setSizes(sizes.filter((_, i) => i !== index));
  }

  const getCategoryName = () => {
    const cat = categories.find((c) => c.id === form.category_id);
    return cat?.name_en || undefined;
  };

  const aiGenerateDesc = async (
    id: string,
    type: 'product_short_description' | 'product_full_description',
    lang: 'en' | 'ro'
  ) => {
    const productName = lang === 'en' ? form.title_en : form.title_ro;
    const fallbackName = lang === 'en' ? form.title_ro : form.title_en;

    const result = await generate(id, {
      type,
      language: lang,
      context: productName || fallbackName || 'menu item',
      category: getCategoryName(),
    });

    if (!result) {
      toast.error('AI generation failed. Please try again.');
      return;
    }

    const fieldMap: Record<string, string> = {
      product_short_description: lang === 'en' ? 'short_description_en' : 'short_description_ro',
      product_full_description: lang === 'en' ? 'full_description_en' : 'full_description_ro',
    };
    setForm((prev) => ({ ...prev, [fieldMap[type]]: result }));
  };

  const aiTranslateDesc = async (
    id: string,
    field: 'short_description' | 'full_description',
    targetLang: 'en' | 'ro'
  ) => {
    const sourceLang = targetLang === 'en' ? 'ro' : 'en';
    const sourceValue = (form as unknown as Record<string, string>)[`${field}_${sourceLang}`];

    if (!sourceValue?.trim()) {
      toast.warning(`No ${sourceLang.toUpperCase()} content to translate from.`);
      return;
    }

    const result = await generate(id, {
      type: 'translate',
      language: targetLang,
      existingContent: sourceValue,
    });

    if (!result) {
      toast.error('Translation failed. Please try again.');
      return;
    }

    setForm((prev) => ({ ...prev, [`${field}_${targetLang}`]: result }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const productData = {
      category_id: form.category_id,
      title_en: form.title_en,
      title_ro: form.title_ro,
      short_description_en: form.short_description_en,
      short_description_ro: form.short_description_ro,
      full_description_en: form.full_description_en,
      full_description_ro: form.full_description_ro,
      special_mentions_en: form.special_mentions_en,
      special_mentions_ro: form.special_mentions_ro,
      ingredients_en: form.ingredients_en,
      ingredients_ro: form.ingredients_ro,
      base_price: parseFloat(form.base_price) || 0,
      image_url: form.image_url,
      dietary_tags: form.dietary_tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      is_minibar_item: form.is_minibar_item,
      is_available: form.is_available,
      is_popular: form.is_popular,
      updated_at: new Date().toISOString(),
    };

    let productId = editingId;

    if (editingId) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const maxOrder = Math.max(...products.map((p) => p.display_order), -1);

      const { data, error: insertError } = await supabase
        .from('products')
        .insert({ ...productData, display_order: maxOrder + 1 })
        .select('id')
        .single();

      if (insertError || !data) {
        setError(insertError?.message || 'Failed to create product');
        setSaving(false);
        return;
      }

      productId = data.id;
    }

    if (productId) {
      await supabase.from('product_sizes').delete().eq('product_id', productId);

      if (sizes.length > 0) {
        const validSizes = sizes.filter((s) => s.size_name_en && s.size_name_ro);
        if (validSizes.length > 0) {
          await supabase.from('product_sizes').insert(
            validSizes.map((s, i) => ({
              product_id: productId,
              size_name_en: s.size_name_en,
              size_name_ro: s.size_name_ro,
              price_modifier: s.price_modifier,
              is_available: s.is_available,
              display_order: i,
            }))
          );
        }
      }

      await supabase.from('product_allergens').delete().eq('product_id', productId);

      if (selectedAllergenIds.length > 0) {
        await supabase.from('product_allergens').insert(
          selectedAllergenIds.map((allergenId) => ({
            product_id: productId,
            allergen_id: allergenId,
          }))
        );
      }
    }

    setSaving(false);
    setShowModal(false);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    await supabase.from('product_sizes').delete().eq('product_id', id);

    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setDeleteConfirm(null);
      fetchProducts();
    }
  }

  async function toggleAvailable(id: string, currentStatus: boolean) {
    await supabase
      .from('products')
      .update({ is_available: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    fetchProducts();
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.title_ro.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => `${price.toFixed(2)} EUR`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your menu items</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_en}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-video bg-gray-100 relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {product.is_popular && (
                  <span className="px-2 py-0.5 bg-primary text-white text-xs font-medium rounded">
                    Popular
                  </span>
                )}
                {!product.is_available && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                    Unavailable
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.title_en}</h3>
                  <p className="text-sm text-gray-500">{product.title_ro}</p>
                </div>
                <span className="font-bold text-primary">
                  {formatPrice(product.base_price)}
                </span>
              </div>

              {product.categories && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded mb-3">
                  {product.categories.name_en}
                </span>
              )}

              {product.short_description_en && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {product.short_description_en}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <button
                  onClick={() => toggleAvailable(product.id, product.is_available)}
                  className={`text-sm font-medium ${
                    product.is_available
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-gray-500 hover:text-gray-600'
                  }`}
                >
                  {product.is_available ? 'Available' : 'Unavailable'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {deleteConfirm === product.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          No products found. {searchQuery && 'Try a different search term.'}
        </div>
      )}

      {showImageSelector && (
        <ImageSelector
          value={null}
          onChange={(items) => {
            if (items.length > 0) {
              setForm({ ...form, image_url: items[0].url });
            }
            setShowImageSelector(false);
          }}
          onClose={() => setShowImageSelector(false)}
          suggestedFolder="products"
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Create Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Romanian) *
                  </label>
                  <input
                    type="text"
                    value={form.title_ro}
                    onChange={(e) => setForm({ ...form, title_ro: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Short Description (English)</label>
                    <div className="flex gap-1">
                      <AIGenerateButton
                        id="short-desc-en"
                        generating={generating}
                        onClick={() => aiGenerateDesc('short-desc-en', 'product_short_description', 'en')}
                      />
                      <AIGenerateButton
                        id="short-desc-en-tr"
                        generating={generating}
                        onClick={() => aiTranslateDesc('short-desc-en-tr', 'short_description', 'ro')}
                        variant="translate"
                      />
                    </div>
                  </div>
                  <textarea
                    value={form.short_description_en}
                    onChange={(e) =>
                      setForm({ ...form, short_description_en: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Short Description (Romanian)</label>
                    <div className="flex gap-1">
                      <AIGenerateButton
                        id="short-desc-ro"
                        generating={generating}
                        onClick={() => aiGenerateDesc('short-desc-ro', 'product_short_description', 'ro')}
                      />
                      <AIGenerateButton
                        id="short-desc-ro-tr"
                        generating={generating}
                        onClick={() => aiTranslateDesc('short-desc-ro-tr', 'short_description', 'en')}
                        variant="translate"
                      />
                    </div>
                  </div>
                  <textarea
                    value={form.short_description_ro}
                    onChange={(e) =>
                      setForm({ ...form, short_description_ro: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Full Description (English)</label>
                    <div className="flex gap-1">
                      <AIGenerateButton
                        id="full-desc-en"
                        generating={generating}
                        onClick={() => aiGenerateDesc('full-desc-en', 'product_full_description', 'en')}
                      />
                      <AIGenerateButton
                        id="full-desc-en-tr"
                        generating={generating}
                        onClick={() => aiTranslateDesc('full-desc-en-tr', 'full_description', 'ro')}
                        variant="translate"
                      />
                    </div>
                  </div>
                  <textarea
                    value={form.full_description_en}
                    onChange={(e) =>
                      setForm({ ...form, full_description_en: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Full Description (Romanian)</label>
                    <div className="flex gap-1">
                      <AIGenerateButton
                        id="full-desc-ro"
                        generating={generating}
                        onClick={() => aiGenerateDesc('full-desc-ro', 'product_full_description', 'ro')}
                      />
                      <AIGenerateButton
                        id="full-desc-ro-tr"
                        generating={generating}
                        onClick={() => aiTranslateDesc('full-desc-ro-tr', 'full_description', 'en')}
                        variant="translate"
                      />
                    </div>
                  </div>
                  <textarea
                    value={form.full_description_ro}
                    onChange={(e) =>
                      setForm({ ...form, full_description_ro: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (EUR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    {form.image_url ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={form.image_url}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image_url: '' })}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowImageSelector(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-500" />
                      {form.image_url ? 'Change Image' : 'Select Image'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allergens.map((allergen) => (
                    <label
                      key={allergen.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedAllergenIds.includes(allergen.id)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAllergenIds.includes(allergen.id)}
                        onChange={() => toggleAllergen(allergen.id)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded accent-red-600"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{allergen.name_en}</div>
                        <div className="text-xs text-gray-500 truncate">{allergen.name_ro}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dietary Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.dietary_tags}
                  onChange={(e) => setForm({ ...form, dietary_tags: e.target.value })}
                  placeholder="vegetarian, vegan, gluten-free"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Mentions (English)
                  </label>
                  <textarea
                    value={form.special_mentions_en}
                    onChange={(e) =>
                      setForm({ ...form, special_mentions_en: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Mentions (Romanian)
                  </label>
                  <textarea
                    value={form.special_mentions_ro}
                    onChange={(e) =>
                      setForm({ ...form, special_mentions_ro: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients (English)
                  </label>
                  <textarea
                    value={form.ingredients_en}
                    onChange={(e) =>
                      setForm({ ...form, ingredients_en: e.target.value })
                    }
                    rows={3}
                    placeholder="Comma-separated list of ingredients"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients (Romanian)
                  </label>
                  <textarea
                    value={form.ingredients_ro}
                    onChange={(e) =>
                      setForm({ ...form, ingredients_ro: e.target.value })
                    }
                    rows={3}
                    placeholder="Lista de ingrediente, separate prin virgula"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Sizes
                  </label>
                  <button
                    type="button"
                    onClick={addSize}
                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Size
                  </button>
                </div>

                {sizes.length > 0 && (
                  <div className="space-y-3">
                    {sizes.map((size, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <input
                            type="text"
                            value={size.size_name_en}
                            onChange={(e) =>
                              updateSize(index, 'size_name_en', e.target.value)
                            }
                            placeholder="Size (EN)"
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            value={size.size_name_ro}
                            onChange={(e) =>
                              updateSize(index, 'size_name_ro', e.target.value)
                            }
                            placeholder="Size (RO)"
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={size.price_modifier}
                            onChange={(e) =>
                              updateSize(index, 'price_modifier', parseFloat(e.target.value) || 0)
                            }
                            placeholder="Price modifier"
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={size.is_available}
                              onChange={(e) =>
                                updateSize(index, 'is_available', e.target.checked)
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded accent-primary"
                            />
                            <span className="text-sm text-gray-600">Available</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSize(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  />
                  <span className="text-gray-700">Available for ordering</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_popular}
                    onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  />
                  <span className="text-gray-700">Mark as popular item</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_minibar_item}
                    onChange={(e) =>
                      setForm({ ...form, is_minibar_item: e.target.checked })
                    }
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  />
                  <span className="text-gray-700">This is a minibar item</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
