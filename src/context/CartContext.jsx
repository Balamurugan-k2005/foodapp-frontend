import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    if (!user || user.role === 'ADMIN') return;
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/cart');
      if (response.data && response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync cart when user logs in or out
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      loadCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await axiosInstance.post('/api/cart/items', {
        productId,
        quantity,
      });
      if (response.data && response.data.success) {
        setCart(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      throw error.response?.data || error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await axiosInstance.put(`/api/cart/items/${productId}?quantity=${quantity}`);
      if (response.data && response.data.success) {
        setCart(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Update quantity failed:', error);
      throw error.response?.data || error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await axiosInstance.delete(`/api/cart/items/${productId}`);
      if (response.data && response.data.success) {
        setCart(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Remove from cart failed:', error);
      throw error.response?.data || error;
    }
  };

  const clearCart = async () => {
    try {
      const response = await axiosInstance.delete('/api/cart');
      if (response.data && response.data.success) {
        setCart({ items: [], totalAmount: 0 });
      }
    } catch (error) {
      console.error('Clear cart failed:', error);
      throw error.response?.data || error;
    }
  };

  const value = {
    cart,
    loading,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
