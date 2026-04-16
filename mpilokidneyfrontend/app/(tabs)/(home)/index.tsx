import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ScanLine,
  ShoppingBag,
  BookOpen,
  Droplets,
  AlertTriangle,
  Apple,
  HeartPulse,
  Activity,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { healthTips } from '@/mocks/healthTips';

const { width } = Dimensions.get('window');

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  droplets: Droplets,
  'alert-triangle': AlertTriangle,
  apple: Apple,
  'heart-pulse': HeartPulse,
  activity: Activity,
  'shield-check': ShieldCheck,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, analyses } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const todayTip = useMemo(() => {
    const dayIndex = new Date().getDate() % healthTips.length;
    return healthTips[dayIndex];
  }, []);

  const todayAnalysisCount = useMemo(() => {
    const today = new Date().toDateString();
    return analyses.filter(a => new Date(a.analyzedAt).toDateString() === today).length;
  }, [analyses]);

  const TipIcon = iconMap[todayTip.icon] || Sparkles;

  const quickActions = [
    { title: 'Analyze Food', icon: ScanLine, color: Colors.primary, route: '/(tabs)/analysis' },
    { title: 'Marketplace', icon: ShoppingBag, color: Colors.accent, route: '/(tabs)/marketplace' },
    { title: 'Education', icon: BookOpen, color: '#0E9F6E', route: '/(tabs)/education' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {profile.name} 👋</Text>
            <Text style={styles.headerSubtitle}>How are your kidneys today?</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <TipIcon size={22} color={Colors.primary} />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipLabel}>Tip of the Day</Text>
            <Text style={styles.tipTitle}>{todayTip.title}</Text>
            <Text style={styles.tipBody} numberOfLines={2}>{todayTip.body}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{todayAnalysisCount}</Text>
              <Text style={styles.statLabel}>Foods Analyzed</Text>
              <Text style={styles.statSub}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{analyses.length}</Text>
              <Text style={styles.statLabel}>Total Analyses</Text>
              <Text style={styles.statSub}>All time</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={() => router.push(action.route as any)}
                testID={`action-${action.title}`}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Analyses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/analysis')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {analyses.slice(0, 3).map((analysis) => (
            <View key={analysis.id} style={styles.analysisCard}>
              <Image
                source={{ uri: analysis.image }}
                style={styles.analysisImage}
                contentFit="cover"
              />
              <View style={styles.analysisInfo}>
                <Text style={styles.analysisName}>{analysis.name}</Text>
                <View style={[
                  styles.ratingBadge,
                  analysis.rating === 'good' && styles.ratingGood,
                  analysis.rating === 'caution' && styles.ratingCaution,
                  analysis.rating === 'avoid' && styles.ratingAvoid,
                ]}>
                  <Text style={[
                    styles.ratingText,
                    analysis.rating === 'good' && styles.ratingTextGood,
                    analysis.rating === 'caution' && styles.ratingTextCaution,
                    analysis.rating === 'avoid' && styles.ratingTextAvoid,
                  ]}>
                    {analysis.rating.charAt(0).toUpperCase() + analysis.rating.slice(1)}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>
          ))}

          <Text style={styles.sectionTitle}>Daily Health Tips</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsScroll}
          >
            {healthTips.map((tip) => {
              const Icon = iconMap[tip.icon] || Sparkles;
              return (
                <View key={tip.id} style={styles.tipCardSmall}>
                  <LinearGradient
                    colors={[Colors.mint, Colors.mintDark]}
                    style={styles.tipCardGradient}
                  >
                    <View style={styles.tipSmallIcon}>
                      <Icon size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.tipSmallTitle}>{tip.title}</Text>
                    <Text style={styles.tipSmallBody} numberOfLines={3}>{tip.body}</Text>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  tipCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextWrap: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  analysisCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  analysisImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  analysisInfo: {
    flex: 1,
    marginLeft: 12,
  },
  analysisName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingGood: {
    backgroundColor: Colors.successLight,
  },
  ratingCaution: {
    backgroundColor: Colors.warningLight,
  },
  ratingAvoid: {
    backgroundColor: Colors.dangerLight,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  ratingTextGood: {
    color: Colors.success,
  },
  ratingTextCaution: {
    color: Colors.warning,
  },
  ratingTextAvoid: {
    color: Colors.danger,
  },
  tipsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  tipCardSmall: {
    width: 180,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipCardGradient: {
    padding: 16,
    minHeight: 140,
  },
  tipSmallIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13,124,95,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipSmallTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  tipSmallBody: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
});