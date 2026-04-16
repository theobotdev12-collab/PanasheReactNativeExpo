import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Edit3,
  Check,
  ChevronRight,
  Bell,
  Heart,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  LogIn,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const ckdStages = ['Not Set', 'Stage 1', 'Stage 2', 'Stage 3a', 'Stage 3b', 'Stage 4', 'Stage 5'];
const dietaryOptions = ['Low Sodium', 'Low Potassium', 'Low Phosphorus', 'Low Protein', 'Diabetic', 'Vegetarian'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, analyses, bookmarks } = useApp();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showCkdPicker, setShowCkdPicker] = useState(false);

  const handleSaveName = useCallback(() => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
    }
    setEditingName(false);
  }, [nameInput, updateProfile]);

  const toggleDietary = useCallback((item: string) => {
    const current = profile.dietaryRestrictions;
    const updated = current.includes(item)
      ? current.filter(d => d !== item)
      : [...current, item];
    updateProfile({ dietaryRestrictions: updated });
  }, [profile.dietaryRestrictions, updateProfile]);

  const handleLogout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }, [logout]);

  const handleAdminPress = useCallback(() => {
    router.push('/admin');
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                onSubmitEditing={handleSaveName}
                testID="name-input"
              />
              <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
                <Check size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => { setNameInput(profile.name); setEditingName(true); }}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Edit3 size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.statsStrip}>
            <View style={styles.stripItem}>
              <Text style={styles.stripValue}>{analyses.length}</Text>
              <Text style={styles.stripLabel}>Analyses</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripItem}>
              <Text style={styles.stripValue}>{bookmarks.length}</Text>
              <Text style={styles.stripLabel}>Bookmarks</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripItem}>
              <Text style={styles.stripValue}>{profile.ckdStage}</Text>
              <Text style={styles.stripLabel}>CKD Stage</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Health Preferences</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowCkdPicker(!showCkdPicker)}
          activeOpacity={0.7}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#7C3AED15' }]}>
            <Heart size={18} color="#7C3AED" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>CKD Stage</Text>
            <Text style={styles.settingValue}>{profile.ckdStage}</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {showCkdPicker && (
          <View style={styles.pickerWrap}>
            {ckdStages.map((stage) => (
              <TouchableOpacity
                key={stage}
                style={[styles.pickerItem, profile.ckdStage === stage && styles.pickerItemActive]}
                onPress={() => { updateProfile({ ckdStage: stage }); setShowCkdPicker(false); }}
              >
                <Text style={[styles.pickerItemText, profile.ckdStage === stage && styles.pickerItemTextActive]}>
                  {stage}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        <View style={styles.dietaryGrid}>
          {dietaryOptions.map((item) => {
            const isActive = profile.dietaryRestrictions.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.dietaryChip, isActive && styles.dietaryChipActive]}
                onPress={() => toggleDietary(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dietaryChipText, isActive && styles.dietaryChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Bell size={18} color={Colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Health reminders & tips</Text>
          </View>
          <Switch
            value={profile.notificationsEnabled}
            onValueChange={(val) => updateProfile({ notificationsEnabled: val })}
            trackColor={{ false: Colors.gray300, true: Colors.primaryLight }}
            thumbColor={Colors.white}
          />
        </View>

        <Text style={styles.sectionTitle}>About</Text>

        <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
          <View style={[styles.settingIcon, { backgroundColor: '#0891B215' }]}>
            <HelpCircle size={18} color="#0891B2" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Help & Support</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
          <View style={[styles.settingIcon, { backgroundColor: '#EA580C15' }]}>
            <Shield size={18} color="#EA580C" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
          <View style={[styles.settingIcon, { backgroundColor: Colors.gray100 }]}>
            <Info size={18} color={Colors.gray500} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </TouchableOpacity>

        {isAuthenticated && isAdmin && (
          <TouchableOpacity style={styles.settingRow} onPress={handleAdminPress} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: '#7C3AED15' }]}>
              <Shield size={18} color="#7C3AED" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Admin Dashboard</Text>
              <Text style={styles.settingValue}>Manage users, vendors & content</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {isAuthenticated ? (
          <TouchableOpacity
            style={[styles.settingRow, { borderColor: Colors.error + '30' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: Colors.error + '15' }]}>
              <LogOut size={18} color={Colors.error} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.error }]}>Logout</Text>
              <Text style={styles.settingValue}>{user?.email}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.settingRow, { borderColor: Colors.primary + '30' }]}
            onPress={() => router.push('/login')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: Colors.primary + '15' }]}>
              <LogIn size={18} color={Colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.primary }]}>Login</Text>
              <Text style={styles.settingValue}>Sign in to access marketplace</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Impilo — Kidney Health Companion</Text>
          <Text style={styles.footerDisclaimer}>
            This app is for informational purposes only and does not replace medical advice.
          </Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 150,
    textAlign: 'center',
  },
  saveNameBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
  },
  stripValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  stripLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  stripDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  settingRow: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pickerWrap: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: Colors.mint,
  },
  pickerItemText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  pickerItemTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dietaryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  dietaryChipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.primary,
  },
  dietaryChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  dietaryChipTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  footerDisclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
