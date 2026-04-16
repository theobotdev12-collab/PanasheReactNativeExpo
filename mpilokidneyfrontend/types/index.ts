export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'vendor';
  created_at: string;
}

export interface Vendor {
  id: number;
  user_id: number;
  business_name: string;
  description: string;
  phone: string;
  address: string;
  status: string;
  name: string;
  email: string;
}

export interface FoodAnalysis {
  id: string;
  name: string;
  image: string;
  rating: 'good' | 'caution' | 'avoid';
  nutrients: {
    sodium: number;
    potassium: number;
    phosphorus: number;
    protein: number;
    calories: number;
  };
  recommendation: string;
  analyzedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  description: string;
  kidneyBadge: 'recommended' | 'safe' | 'moderate';
  nutrients: {
    sodium: string;
    potassium: string;
    phosphorus: string;
  };
  inStock: boolean;
}

export type ProductCategory = 'fruits' | 'vegetables' | 'grains' | 'supplements';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: ArticleCategory;
  image: string;
  readTime: number;
  author: string;
  publishedAt: string;
}

export type ArticleCategory = 'nutrition' | 'lifestyle' | 'understanding-ckd' | 'recipes';

export interface UserProfile {
  name: string;
  avatarUrl: string;
  ckdStage: string;
  dietaryRestrictions: string[];
  notificationsEnabled: boolean;
}

export interface HealthTip {
  id: string;
  title: string;
  body: string;
  icon: string;
}