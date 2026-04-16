import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FoodAnalysis } from '@/types';

// ✅ Change this to your Flask server IP when running on a real device
// For emulator/web use: http://127.0.0.1:5000
// For physical phone use: http://<YOUR_PC_IP>:5000  e.g. http://192.168.1.5:5000
const FLASK_API_URL = 'http://127.0.0.1:5000';

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const { analyses, addAnalysis } = useApp();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async (imageUri: string): Promise<FoodAnalysis> => {
      setApiError(null);

      // Build multipart form data to send image to Flask
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, fetch the blob from the URI
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'food.jpg');
      } else {
        // On mobile, use the URI directly
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'food.jpg',
        } as any);
      }

      const response = await fetch(`${FLASK_API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Map Flask response to FoodAnalysis type
      // kidney_verdict: "Kidney friendly" or "Not kidney friendly"
      const isKidneyFriendly = data.kidney_verdict === 'Kidney friendly';
      const hasIssues = data.issues && data.issues.length > 0;

      let rating: 'good' | 'caution' | 'avoid';
      if (isKidneyFriendly) {
        rating = 'good';
      } else if (hasIssues && data.issues.length === 1) {
        rating = 'caution';
      } else {
        rating = 'avoid';
      }

      // Build recommendation text from issues
      let recommendation = '';
      if (isKidneyFriendly) {
        recommendation = `${data.food} is kidney friendly! Safe to consume with balanced meals.`;
      } else {
        const issueList = data.issues.join(', ');
        recommendation = `${data.food} has concerns: ${issueList}. Consult your dietitian before consuming.`;
      }

      const confidencePct = Math.round(data.confidence * 100);

      return {
        id: `fa_${Date.now()}`,
        name: `${data.food} (${confidencePct}% confident)`,
        image: imageUri,
        rating,
        nutrients: {
          sodium: data.nutrients.sodium,
          potassium: data.nutrients.potassium,
          phosphorus: data.nutrients.phosphorus,
          protein: 0, // not returned by your API, defaulting to 0
          calories: 0, // not returned by your API, defaulting to 0
        },
        recommendation,
        analyzedAt: new Date().toISOString(),
      };
    },
    onSuccess: (result) => {
      addAnalysis(result);
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
    onError: (error: Error) => {
      setApiError(error.message);
    },
  });

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      resultAnim.setValue(0);
      analyzeMutation.mutate(uri);
    }
  }, [analyzeMutation, resultAnim]);

  const takePhoto = useCallback(async () => {
    if (Platform.OS === 'web') {
      pickImage();
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      resultAnim.setValue(0);
      analyzeMutation.mutate(uri);
    }
  }, [analyzeMutation, resultAnim, pickImage]);

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle size={18} color={Colors.success} />;
      case 'caution': return <AlertCircle size={18} color={Colors.warning} />;
      case 'avoid': return <XCircle size={18} color={Colors.danger} />;
      default: return null;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return Colors.success;
      case 'caution': return Colors.warning;
      case 'avoid': return Colors.danger;
      default: return Colors.textMuted;
    }
  };

  const getRatingBg = (rating: string) => {
    switch (rating) {
      case 'good': return Colors.successLight;
      case 'caution': return Colors.warningLight;
      case 'avoid': return Colors.dangerLight;
      default: return Colors.gray100;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Food Analysis</Text>
        <Text style={styles.headerSub}>Scan food to check kidney-friendliness</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.uploadSection}>
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={takePhoto}
                activeOpacity={0.7}
                testID="take-photo"
              >
                <Camera size={28} color={Colors.white} />
                <Text style={styles.uploadBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, styles.uploadBtnAlt]}
                onPress={pickImage}
                activeOpacity={0.7}
                testID="pick-image"
              >
                <ImagePlus size={28} color={Colors.primary} />
                <Text style={[styles.uploadBtnText, styles.uploadBtnTextAlt]}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {analyzeMutation.isPending && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyzing your food...</Text>
                <Text style={styles.loadingSubtext}>Sending to AI model...</Text>
              </View>
            )}

            {/* ✅ API Error display */}
            {apiError && !analyzeMutation.isPending && (
              <View style={styles.errorCard}>
                <XCircle size={20} color={Colors.danger} />
                <Text style={styles.errorText}>{apiError}</Text>
                <Text style={styles.errorHint}>
                  Make sure your Flask server is running at {FLASK_API_URL}
                </Text>
              </View>
            )}

            {analyzeMutation.data && !analyzeMutation.isPending && !apiError && (
              <Animated.View style={[
                styles.resultCard,
                {
                  opacity: resultAnim,
                  transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                },
              ]}>
                <View style={styles.resultHeader}>
                  <Image
                    source={{ uri: analyzeMutation.data.image }}
                    style={styles.resultImage}
                    contentFit="cover"
                  />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{analyzeMutation.data.name}</Text>
                    <View style={[styles.resultBadge, { backgroundColor: getRatingBg(analyzeMutation.data.rating) }]}>
                      {getRatingIcon(analyzeMutation.data.rating)}
                      <Text style={[styles.resultBadgeText, { color: getRatingColor(analyzeMutation.data.rating) }]}>
                        {analyzeMutation.data.rating === 'good'
                          ? 'Kidney Friendly'
                          : analyzeMutation.data.rating === 'caution'
                          ? 'Use Caution'
                          : 'Not Recommended'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.nutrientsGrid}>
                  {[
                    { label: 'Sodium', value: `${analyzeMutation.data.nutrients.sodium}mg`, key: 'sodium' },
                    { label: 'Potassium', value: `${analyzeMutation.data.nutrients.potassium}mg`, key: 'potassium' },
                    { label: 'Phosphorus', value: `${analyzeMutation.data.nutrients.phosphorus}mg`, key: 'phosphorus' },
                  ].map((n) => (
                    <View key={n.key} style={styles.nutrientItem}>
                      <Text style={styles.nutrientValue}>{n.value}</Text>
                      <Text style={styles.nutrientLabel}>{n.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recommendationBox}>
                  <Zap size={16} color={Colors.primary} />
                  <Text style={styles.recommendationText}>{analyzeMutation.data.recommendation}</Text>
                </View>
              </Animated.View>
            )}
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Analysis History</Text>
            <Text style={styles.historyCount}>{analyses.length} items</Text>
          </View>

          {analyses.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                activeOpacity={0.7}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <View style={styles.historyRow}>
                  <Image source={{ uri: item.image }} style={styles.historyImage} contentFit="cover" />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{item.name}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.analyzedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.historyBadge, { backgroundColor: getRatingBg(item.rating) }]}>
                    <Text style={[styles.historyBadgeText, { color: getRatingColor(item.rating) }]}>
                      {item.rating.charAt(0).toUpperCase() + item.rating.slice(1)}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={18} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={18} color={Colors.textMuted} />
                  )}
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.nutrientsGrid}>
                      {[
                        { label: 'Sodium', value: `${item.nutrients.sodium}mg`, key: 'sodium' },
                        { label: 'Potassium', value: `${item.nutrients.potassium}mg`, key: 'potassium' },
                        { label: 'Phosphorus', value: `${item.nutrients.phosphorus}mg`, key: 'phosphorus' },
                      ].map((n) => (
                        <View key={n.key} style={styles.nutrientItem}>
                          <Text style={styles.nutrientValue}>{n.value}</Text>
                          <Text style={styles.nutrientLabel}>{n.label}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.historyRecommendation}>{item.recommendation}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  uploadBtnAlt: {
    backgroundColor: Colors.mint,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  uploadBtnTextAlt: {
    color: Colors.primary,
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 14,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  nutrientItem: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  nutrientLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: Colors.mint,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  historyCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 4,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  historyRecommendation: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
});