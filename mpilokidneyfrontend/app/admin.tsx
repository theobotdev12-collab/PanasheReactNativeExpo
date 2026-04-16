import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Activity,
  LogOut,
  ChevronRight,
  BarChart3,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const API_URL = 'http://127.0.0.1:5000';

interface Stats {
  total_users: number;
  total_vendors: number;
  total_products: number;
  total_orders: number;
  total_analyses: number;
  user_analyses: number;
  top_foods: { food: string; count: number }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Vendor {
  id: number;
  business_name: string;
  description: string;
  phone: string;
  status: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { isAdmin, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'vendors'>('overview');

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const [statsRes, usersRes, vendorsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/users`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/vendors`, { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Admin access required');
      router.replace('/');
      return;
    }
    fetchData();
  }, [isAdmin, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout]);

  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendors' && styles.tabActive]}
          onPress={() => setActiveTab('vendors')}
        >
          <Text style={[styles.tabText, activeTab === 'vendors' && styles.tabTextActive]}>
            Vendors
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && stats && (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
                <Users size={28} color="#4F46E5" />
                <Text style={styles.statValue}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <Store size={28} color="#F59E0B" />
                <Text style={styles.statValue}>{stats.total_vendors}</Text>
                <Text style={styles.statLabel}>Vendors</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
                <Package size={28} color="#22C55E" />
                <Text style={styles.statValue}>{stats.total_products}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
                <ShoppingCart size={28} color="#EC4899" />
                <Text style={styles.statValue}>{stats.total_orders}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}>
                <Activity size={28} color="#6366F1" />
                <Text style={styles.statValue}>{stats.total_analyses}</Text>
                <Text style={styles.statLabel}>Total Analyses</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#CFFAFE' }]}>
                <BarChart3 size={28} color="#06B6D4" />
                <Text style={styles.statValue}>{stats.user_analyses}</Text>
                <Text style={styles.statLabel}>User Analyses</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Analyzed Foods</Text>
              {stats.top_foods.length > 0 ? (
                stats.top_foods.map((item, index) => (
                  <View key={index} style={styles.topFoodItem}>
                    <Text style={styles.topFoodRank}>#{index + 1}</Text>
                    <Text style={styles.topFoodName}>{item.food}</Text>
                    <Text style={styles.topFoodCount}>{item.count} analyses</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No analyses yet</Text>
              )}
            </View>
          </>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Users</Text>
            {users.length > 0 ? (
              users.map((user) => (
                <TouchableOpacity key={user.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listItemTitle}>{user.name}</Text>
                    <Text style={styles.listItemSubtitle}>{user.email}</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{user.role}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No users registered</Text>
            )}
          </View>
        )}

        {activeTab === 'vendors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Vendors</Text>
            {vendors.length > 0 ? (
              vendors.map((vendor) => (
                <TouchableOpacity key={vendor.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listItemTitle}>{vendor.business_name}</Text>
                    <Text style={styles.listItemSubtitle}>{vendor.name} ({vendor.email})</Text>
                  </View>
                  <View style={[styles.chip, vendor.status === 'active' && styles.chipActive]}>
                    <Text style={[styles.chipText, vendor.status === 'active' && styles.chipTextActive]}>
                      {vendor.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No vendors registered</Text>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  logoutBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.gray100,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  topFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  topFoodRank: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    width: 30,
  },
  topFoodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  topFoodCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  chipActive: {
    backgroundColor: Colors.mint,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: 20,
  },
});
