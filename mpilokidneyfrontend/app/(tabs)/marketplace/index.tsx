import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Star,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { products } from '@/mocks/products';
import { Product, ProductCategory } from '@/types';

const categories: { key: ProductCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'grains', label: 'Grains' },
  { key: 'supplements', label: 'Supplements' },
];

const badgeConfig = {
  recommended: { icon: Star, color: Colors.success, bg: Colors.successLight, label: 'Recommended' },
  safe: { icon: ShieldCheck, color: Colors.primary, bg: Colors.mint, label: 'Safe' },
  moderate: { icon: AlertTriangle, color: Colors.warning, bg: Colors.warningLight, label: 'Moderate' },
} as const;

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { cart, addToCart, removeFromCart, updateCartQuantity, cartTotal, cartCount, clearCart } = useApp();
  const { isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const cartBounce = useRef(new Animated.Value(1)).current;

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleAddToCart = useCallback((product: Product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to purchase products', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    addToCart(product);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(cartBounce, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(cartBounce, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [addToCart, cartBounce, isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSub}>Kidney-friendly organic products</Text>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCartVisible(true)}
            activeOpacity={0.7}
            testID="cart-button"
          >
            <Animated.View style={{ transform: [{ scale: cartBounce }] }}>
              <ShoppingCart size={22} color={Colors.primary} />
            </Animated.View>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, selectedCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.productsGrid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.map((product) => {
          const badge = badgeConfig[product.kidneyBadge];
          const BadgeIcon = badge.icon;
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              activeOpacity={0.8}
              onPress={() => setSelectedProduct(product)}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} contentFit="cover" />
              <View style={[styles.kidneyBadge, { backgroundColor: badge.bg }]}>
                <BadgeIcon size={12} color={badge.color} />
                <Text style={[styles.kidneyBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(product)}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!selectedProduct} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.productDetail, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProduct(null)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedProduct.image }} style={styles.detailImage} contentFit="cover" />
                <View style={styles.detailContent}>
                  <View style={[styles.kidneyBadge, { backgroundColor: badgeConfig[selectedProduct.kidneyBadge].bg, marginBottom: 10 }]}>
                    {React.createElement(badgeConfig[selectedProduct.kidneyBadge].icon, { size: 14, color: badgeConfig[selectedProduct.kidneyBadge].color })}
                    <Text style={[styles.kidneyBadgeText, { color: badgeConfig[selectedProduct.kidneyBadge].color }]}>
                      {badgeConfig[selectedProduct.kidneyBadge].label}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selectedProduct.name}</Text>
                  <Text style={styles.detailPrice}>${selectedProduct.price.toFixed(2)}</Text>
                  <Text style={styles.detailDesc}>{selectedProduct.description}</Text>

                  <Text style={styles.nutrientSectionTitle}>Kidney Health Nutrients</Text>
                  <View style={styles.nutrientRow}>
                    {Object.entries(selectedProduct.nutrients).map(([key, value]) => (
                      <View key={key} style={styles.nutrientPill}>
                        <Text style={styles.nutrientPillLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                        <Text style={styles.nutrientPillValue}>{value}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.addToCartBtn}
                    onPress={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    activeOpacity={0.8}
                  >
                    <ShoppingCart size={20} color={Colors.white} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={cartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Your Cart</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingCart size={48} color={Colors.textMuted} />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <Text style={styles.emptyCartSub}>Browse kidney-friendly products</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartList}>
                  {cart.map((item) => (
                    <View key={item.product.id} style={styles.cartItem}>
                      <Image source={{ uri: item.product.image }} style={styles.cartItemImage} contentFit="cover" />
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.product.name}</Text>
                        <Text style={styles.cartItemPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
                      </View>
                      <View style={styles.cartQuantity}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus size={14} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus size={14} color={Colors.text} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                        <Trash2 size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.cartFooter}>
                  <View style={styles.cartTotalRow}>
                    <Text style={styles.cartTotalLabel}>Total</Text>
                    <Text style={styles.cartTotalValue}>${cartTotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.8}>
                    <Text style={styles.checkoutText}>Checkout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
                    <Text style={styles.clearCartText}>Clear Cart</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  categoriesScroll: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  productCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexGrow: 1,
    maxWidth: '48.5%',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  kidneyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginLeft: 10,
    marginTop: -12,
  },
  kidneyBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  productDetail: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailContent: {
    padding: 20,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  detailDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  nutrientSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  nutrientRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  nutrientPill: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  nutrientPillLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  nutrientPillValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addToCartBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  cartSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 300,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyCartSub: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  cartList: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 2,
  },
  cartQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  cartFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  cartTotalValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  clearCartBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearCartText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
