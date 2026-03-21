import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  productTitleEn: string;
  productTitleRo: string;
  sizeId?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  isMinibar: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, sizeId?: string) => void;
  updateQuantity: (productId: string, sizeId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage disabled', e);
    }
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.productId === newItem.productId && item.sizeId === newItem.sizeId
      );

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }

      return [...current, newItem];
    });
  };

  const removeItem = (productId: string, sizeId?: string) => {
    setItems((current) =>
      current.filter((item) => !(item.productId === productId && item.sizeId === sizeId))
    );
  };

  const updateQuantity = (productId: string, sizeId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, sizeId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.productId === productId && item.sizeId === sizeId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
