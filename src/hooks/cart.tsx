import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import useFloatingHeaderHeight from '@react-navigation/stack/lib/typescript/src/utils/useHeaderHeight';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      const parsedProducts = JSON.parse(loadedProducts || '');

      setProducts(parsedProducts);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async item => {
      const productIndex = products.findIndex(p => p.id === item.id);

      if (productIndex !== -1) {
        products[productIndex].quantity += 1;
        setProducts([...products]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      } else {
        setProducts(prev => [...prev, { ...item, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products, { ...item, quantity: 1 }]),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    id => {
      products.forEach(async product => {
        if (product.id === id) {
          product.quantity += 1;
          setProducts([...products]);
          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(products),
          );
        }
      });
    },
    [products],
  );

  const decrement = useCallback(
    id => {
      products.forEach(async product => {
        if (product.id === id && product.quantity > 0) {
          product.quantity -= 1;
          setProducts([...products]);
          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(products),
          );
        }
      });
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
