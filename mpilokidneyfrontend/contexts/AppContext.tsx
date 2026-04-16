import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { FoodAnalysis, CartItem, Product, UserProfile } from '@/types';
import { sampleAnalyses } from '@/mocks/foodAnalysis';

const STORAGE_KEYS = {
  ONBOARDING: 'impilo_onboarding_complete',
  BOOKMARKS: 'impilo_bookmarks',
  PROFILE: 'impilo_profile',
  ANALYSES: 'impilo_analyses',
  CART: 'impilo_cart',
} as const;

const defaultProfile: UserProfile = {
  name: 'User',
  avatarUrl: '',
  ckdStage: 'Not Set',
  dietaryRestrictions: [],
  notificationsEnabled: true,
};

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [analyses, setAnalyses] = useState<FoodAnalysis[]>(sampleAnalyses);
  const [cart, setCart] = useState<CartItem[]>([]);

  const initQuery = useQuery({
    queryKey: ['app-init'],
    queryFn: async () => {
      const [onboarding, storedBookmarks, storedProfile, storedAnalyses, storedCart] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.ANALYSES),
        AsyncStorage.getItem(STORAGE_KEYS.CART),
      ]);
      return {
        onboarding: onboarding === 'true',
        bookmarks: storedBookmarks ? JSON.parse(storedBookmarks) : [],
        profile: storedProfile ? JSON.parse(storedProfile) : defaultProfile,
        analyses: storedAnalyses ? JSON.parse(storedAnalyses) : sampleAnalyses,
        cart: storedCart ? JSON.parse(storedCart) : [],
      };
    },
  });

  useEffect(() => {
    if (initQuery.data) {
      setOnboardingComplete(initQuery.data.onboarding);
      setBookmarks(initQuery.data.bookmarks);
      setProfile(initQuery.data.profile);
      setAnalyses(initQuery.data.analyses);
      setCart(initQuery.data.cart);
    }
  }, [initQuery.data]);

  const persistMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await AsyncStorage.setItem(key, value);
    },
  });

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    persistMutation.mutate({ key: STORAGE_KEYS.ONBOARDING, value: 'true' });
  }, [persistMutation]);

  const toggleBookmark = useCallback((articleId: string) => {
    setBookmarks(prev => {
      const updated = prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId];
      persistMutation.mutate({ key: STORAGE_KEYS.BOOKMARKS, value: JSON.stringify(updated) });
      return updated;
    });
  }, [persistMutation]);

  const isBookmarked = useCallback((articleId: string) => {
    return bookmarks.includes(articleId);
  }, [bookmarks]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      persistMutation.mutate({ key: STORAGE_KEYS.PROFILE, value: JSON.stringify(updated) });
      return updated;
    });
  }, [persistMutation]);

  const addAnalysis = useCallback((analysis: FoodAnalysis) => {
    setAnalyses(prev => {
      const updated = [analysis, ...prev];
      persistMutation.mutate({ key: STORAGE_KEYS.ANALYSES, value: JSON.stringify(updated) });
      return updated;
    });
  }, [persistMutation]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [...prev, { product, quantity: 1 }];
      }
      persistMutation.mutate({ key: STORAGE_KEYS.CART, value: JSON.stringify(updated) });
      return updated;
    });
  }, [persistMutation]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      persistMutation.mutate({ key: STORAGE_KEYS.CART, value: JSON.stringify(updated) });
      return updated;
    });
  }, [persistMutation]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev => {
      const updated = quantity <= 0
        ? prev.filter(item => item.product.id !== productId)
        : prev.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          );
      persistMutation.mutate({ key: STORAGE_KEYS.CART, value: JSON.stringify(updated) });
      return updated;
    });
  }, [persistMutation]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
    persistMutation.mutate({ key: STORAGE_KEYS.CART, value: JSON.stringify([]) });
  }, [persistMutation]);

  return {
    isLoading: initQuery.isLoading,
    onboardingComplete,
    completeOnboarding,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    profile,
    updateProfile,
    analyses,
    addAnalysis,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    cartCount,
    clearCart,
  };
});