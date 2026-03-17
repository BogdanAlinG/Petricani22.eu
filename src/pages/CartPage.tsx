import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { usePrice } from '../hooks/usePrice';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';

export default function CartPage() {
  const { language } = useLanguage();
  const { menuPath, checkoutPath } = useLocalizedPath();
  const { items, updateQuantity, removeItem, totalAmount, totalItems } = useCart();
  const { formatPrice } = usePrice();
  const navigate = useNavigate();

  const content = {
    RO: {
      title: 'Cosul Tau',
      empty: 'Cosul tau este gol',
      continueShopping: 'Continua Cumparaturile',
      minibarItems: 'Produse Mini-Bar (Disponibil 24/7)',
      foodItems: 'Mancare (Livrare Urmatoarea Zi)',
      remove: 'Elimina',
      subtotal: 'Subtotal',
      total: 'Total',
      proceedToCheckout: 'Continua la Plata',
      items: 'articole',
      each: 'fiecare',
    },
    EN: {
      title: 'Your Cart',
      empty: 'Your cart is empty',
      continueShopping: 'Continue Shopping',
      minibarItems: 'Mini-Bar Items (Available 24/7)',
      foodItems: 'Food (Next-Day Delivery)',
      remove: 'Remove',
      subtotal: 'Subtotal',
      total: 'Total',
      proceedToCheckout: 'Proceed to Checkout',
      items: 'items',
      each: 'each',
    },
  };

  const t = content[language];

  const minibarItems = items.filter((item) => item.isMinibar);
  const foodItems = items.filter((item) => !item.isMinibar);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.empty}</h2>
          <Link
            to={menuPath}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            {t.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  const renderItems = (itemsToRender: typeof items, title: string) => {
    if (itemsToRender.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          {itemsToRender.map((item) => {
            const productTitle =
              language === 'RO' ? item.productTitleRo : item.productTitleEn;
            const itemTotal = item.unitPrice * item.quantity;

            return (
              <div
                key={`${item.productId}-${item.sizeId || 'default'}`}
                className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={productTitle}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{productTitle}</h3>
                  {item.sizeName && (
                    <p className="text-sm text-gray-600">{item.sizeName}</p>
                  )}
                  <p className="text-sm text-gray-600">{formatPrice(item.unitPrice)} {t.each}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.sizeId, item.quantity - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:border-gray-400 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.sizeId, item.quantity + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatPrice(itemTotal)}</div>
                  <button
                    onClick={() => removeItem(item.productId, item.sizeId)}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.remove}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={menuPath}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.continueShopping}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t.title} ({totalItems} {t.items})
        </h1>

        {renderItems(foodItems, t.foodItems)}
        {renderItems(minibarItems, t.minibarItems)}

        <div className="bg-white rounded-lg shadow-md p-6 sticky bottom-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-900">{t.total}</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(totalAmount)}
            </span>
          </div>
          <button
            onClick={() => navigate(checkoutPath)}
            className="w-full bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary-dark transition-colors font-semibold text-lg"
          >
            {t.proceedToCheckout}
          </button>
        </div>
      </div>
    </div>
  );
}
