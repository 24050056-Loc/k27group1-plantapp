import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform
} from "react-native";
import { Compass, Sparkles, ImagePlus, Filter, Search } from "lucide-react-native";
import { Review } from "../../types/review";
import { getReviews } from "../../services/reviewService";
import { ReviewCard } from "../components/review/ReviewCard";
import { CreatePostModal } from "../components/review/CreatePostModal";
import { ImageLightboxModal } from "../components/review/ImageLightboxModal";
import { CommentSheetModal } from "../components/review/CommentSheetModal";

const CATEGORIES = ["Tất cả", "Đánh giá hot", "Khoe cây 🌿", "Mẹo chăm sóc"];

type ExploreScreenProps = {
  isCreatePostOpen: boolean;
  onOpenCreatePost: () => void;
  onCloseCreatePost: () => void;
};

export default function ExploreScreen({
  isCreatePostOpen,
  onOpenCreatePost,
  onCloseCreatePost
}: ExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals state
  const [lightboxState, setLightboxState] = useState<{ visible: boolean; images: string[]; index: number }>({
    visible: false,
    images: [],
    index: 0
  });
  const [commentModalState, setCommentModalState] = useState<{ visible: boolean; reviewId: number }>({
    visible: false,
    reviewId: 0
  });

  useEffect(() => {
    loadFeed(selectedCategory);
  }, [selectedCategory]);

  const loadFeed = async (category: string) => {
    setLoading(true);
    const data = await getReviews(category);
    setReviews(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await getReviews(selectedCategory);
    setReviews(data);
    setRefreshing(false);
  };

  const handlePostSuccess = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleOpenLightbox = (images: string[], index: number) => {
    setLightboxState({ visible: true, images, index });
  };

  const handleOpenComments = (reviewId: number) => {
    setCommentModalState({ visible: true, reviewId });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Top App Bar Header */}
      <View style={styles.appHeader}>
        <View style={styles.logoRow}>
          <Compass size={28} color="#2E7D32" />
          <Text style={styles.headerTitle}>Khám Phá</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconCircleBtn}>
            <Search size={20} color="#1A2E1A" />
          </TouchableOpacity>

        </View>
      </View>

      {/* Topic Filter Chips */}
      <View style={styles.chipContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setSelectedCategory(item)}
              >
                {isSelected && <Sparkles size={14} color="#FFF" style={{ marginRight: 4 }} />}
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Content Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Đang tải bài viết mới nhất...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#2E7D32"]}
            />
          }
          ListHeaderComponent={
            /* Post Composer Prompt Bar (Facebook style) */
            <View style={styles.composerCard}>
              <TouchableOpacity
                style={styles.composerRow}
                onPress={onOpenCreatePost}
              >
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" }}
                  style={styles.composerAvatar}
                />
                <Text style={styles.composerPlaceholder}>
                  Chia sẻ góc xanh hoặc khoe cây của bạn...
                </Text>
              </TouchableOpacity>

              <View style={styles.composerDivider} />

              <View style={styles.composerActions}>
                <TouchableOpacity
                  style={styles.composerActionBtn}
                  onPress={onOpenCreatePost}
                >
                  <ImagePlus size={18} color="#2E7D32" />
                  <Text style={styles.composerActionText}>Ảnh/Đánh giá</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.composerActionBtn}
                  onPress={onOpenCreatePost}
                >
                  <Sparkles size={18} color="#FF9800" />
                  <Text style={styles.composerActionText}>Khoe Vườn Cây</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onPressImage={handleOpenLightbox}
              onPressComment={handleOpenComments}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có bài viết nào thuộc mục này.</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <CreatePostModal
        visible={isCreatePostOpen}
        defaultCategory={selectedCategory !== "Tất cả" ? selectedCategory : "Mới nhất"}
        onClose={onCloseCreatePost}
        onPostSuccess={handlePostSuccess}
      />

      <ImageLightboxModal
        visible={lightboxState.visible}
        images={lightboxState.images}
        initialIndex={lightboxState.index}
        onClose={() => setLightboxState({ visible: false, images: [], index: 0 })}
      />

      <CommentSheetModal
        visible={commentModalState.visible}
        reviewId={commentModalState.reviewId}
        onClose={() => setCommentModalState({ visible: false, reviewId: 0 })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F6F8F6"
  },
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 12,
    paddingBottom: 8,
    backgroundColor: "#FFF"
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2E1A"
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F4F0",
    justifyContent: "center",
    alignItems: "center"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4
  },
  headerPostBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700"
  },
  chipContainer: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2EE"
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F4F0",
    marginRight: 8
  },
  activeChip: {
    backgroundColor: "#2E7D32"
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444"
  },
  activeChipText: {
    color: "#FFF"
  },
  feedContent: {
    padding: 16,
    paddingBottom: 80
  },
  composerCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEF2EE"
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  composerPlaceholder: {
    fontSize: 14,
    color: "#888",
    flex: 1
  },
  composerDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12
  },
  composerActions: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  composerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  composerActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666"
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center"
  },
  emptyText: {
    color: "#888",
    fontSize: 14
  }
});
