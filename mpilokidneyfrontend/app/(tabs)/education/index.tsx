import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Search,
  Clock,
  Bookmark,
  BookmarkCheck,
  X,
  ChevronRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { articles } from '@/mocks/articles';
import { Article, ArticleCategory } from '@/types';

const categoryFilters: { key: ArticleCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'understanding-ckd', label: 'CKD' },
  { key: 'recipes', label: 'Recipes' },
];

const categoryColors: Record<ArticleCategory, string> = {
  nutrition: '#059669',
  lifestyle: '#0891B2',
  'understanding-ckd': '#7C3AED',
  recipes: '#EA580C',
};

export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const { toggleBookmark, isBookmarked } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selectedCategory, searchQuery]);

  const featuredArticle = useMemo(() => articles[0], []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Education Hub</Text>
        <Text style={styles.headerSub}>Expert kidney health resources</Text>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {categoryFilters.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, selectedCategory === cat.key && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, selectedCategory === cat.key && styles.filterTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory === 'all' && !searchQuery && (
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.8}
            onPress={() => setSelectedArticle(featuredArticle)}
          >
            <Image source={{ uri: featuredArticle.image }} style={styles.featuredImage} contentFit="cover" />
            <View style={styles.featuredOverlay}>
              <View style={[styles.categoryTag, { backgroundColor: categoryColors[featuredArticle.category] }]}>
                <Text style={styles.categoryTagText}>
                  {categoryFilters.find(c => c.key === featuredArticle.category)?.label}
                </Text>
              </View>
              <Text style={styles.featuredTitle}>{featuredArticle.title}</Text>
              <View style={styles.featuredMeta}>
                <Clock size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.featuredMetaText}>{featuredArticle.readTime} min read</Text>
                <Text style={styles.featuredMetaText}>• {featuredArticle.author}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {filteredArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            activeOpacity={0.7}
            onPress={() => setSelectedArticle(article)}
          >
            <Image source={{ uri: article.image }} style={styles.articleImage} contentFit="cover" />
            <View style={styles.articleContent}>
              <View style={[styles.categoryTagSmall, { backgroundColor: categoryColors[article.category] + '20' }]}>
                <Text style={[styles.categoryTagSmallText, { color: categoryColors[article.category] }]}>
                  {categoryFilters.find(c => c.key === article.category)?.label}
                </Text>
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
              <View style={styles.articleFooter}>
                <View style={styles.articleMeta}>
                  <Clock size={12} color={Colors.textMuted} />
                  <Text style={styles.articleMetaText}>{article.readTime} min</Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleBookmark(article.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {isBookmarked(article.id) ? (
                    <BookmarkCheck size={18} color={Colors.primary} />
                  ) : (
                    <Bookmark size={18} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredArticles.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No articles found</Text>
            <Text style={styles.emptySub}>Try a different search or category</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedArticle} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.articleDetail, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedArticle(null)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
            {selectedArticle && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedArticle.image }} style={styles.detailImage} contentFit="cover" />
                <View style={styles.detailContent}>
                  <View style={[styles.categoryTag, { backgroundColor: categoryColors[selectedArticle.category] }]}>
                    <Text style={styles.categoryTagText}>
                      {categoryFilters.find(c => c.key === selectedArticle.category)?.label}
                    </Text>
                  </View>
                  <Text style={styles.detailTitle}>{selectedArticle.title}</Text>
                  <View style={styles.detailMeta}>
                    <Text style={styles.detailAuthor}>By {selectedArticle.author}</Text>
                    <View style={styles.detailReadTime}>
                      <Clock size={14} color={Colors.textMuted} />
                      <Text style={styles.detailReadTimeText}>{selectedArticle.readTime} min read</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => toggleBookmark(selectedArticle.id)}
                    activeOpacity={0.7}
                  >
                    {isBookmarked(selectedArticle.id) ? (
                      <>
                        <BookmarkCheck size={18} color={Colors.primary} />
                        <Text style={[styles.bookmarkBtnText, { color: Colors.primary }]}>Bookmarked</Text>
                      </>
                    ) : (
                      <>
                        <Bookmark size={18} color={Colors.textSecondary} />
                        <Text style={styles.bookmarkBtnText}>Bookmark</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.detailBody}>{selectedArticle.content}</Text>
                </View>
              </ScrollView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  filtersScroll: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    height: 200,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  articleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  articleImage: {
    width: 110,
    height: 120,
  },
  articleContent: {
    flex: 1,
    padding: 12,
  },
  categoryTagSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryTagSmallText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  articleSummary: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    flex: 1,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  articleMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  articleDetail: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailContent: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailAuthor: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  detailReadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailReadTimeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  bookmarkBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
});
