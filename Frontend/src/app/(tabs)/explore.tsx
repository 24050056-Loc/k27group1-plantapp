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
  Platform,
  Alert
} from "react-native";
import { Compass, Sparkles, ImagePlus, Search, WifiOff, RotateCcw } from "lucide-react-native";
import { Review } from "../../types/review";
import { getReviews, resolveImageUrl } from "../../services/reviewService";
import { useAuth } from "../../context/AuthContext";
import { recordCommunityExplore } from "../../services/dailyTaskService";
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
  const { user } = useAuth();
  const profileName = user?.ho_ten || user?.ten_dang_nhap || "Bạn";
  const profileAvatar = resolveImageUrl(user?.avatar);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [selectedCategory, user?.id]);

  // Ghi nhận nhiệm vụ hàng ngày: Khám phá cộng đồng
  useEffect(() => {
    if (user?.id) {
      recordCommunityExplore().catch((err) => {
        console.warn("[daily_tasks] Không thể ghi nhận khám phá cộng đồng:", err?.message);
      });
    }
  }, [user?.id]);

  const loadFeed = async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviews(category, user?.id);
      setReviews(data);
    } catch (err: any) {
      console.error("Lỗi load feed explore:", err);
      setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await getReviews(selectedCategory, user?.id);
      setReviews(data);
    } catch (err: any) {
      console.error("Lỗi refresh explore:", err);
      setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setRefreshing(false);
    }
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

  const handleCommentCountChange = (reviewId: number, delta: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, comment_count: Math.max(0, (r.comment_count || 0) + delta) }
          : r
      )
    );
  };

  const handleOpenCreatePostCheck = () => {
    if (!user) {
      Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để chia sẻ bài viết hoặc khoe cây của bạn.");
      return;
    }
    onOpenCreatePost();
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
          <Text style={styles.loadingText}>Đang tải bài viết từ máy chủ...</Text>
        </View>
      ) : error && reviews.length === 0 ? (
        <View style={styles.errorContainer}>
          <WifiOff size={48} color="#A5D6A7" />
          <Text style={styles.errorTitle}>Không thể kết nối đến máy chủ</Text>
          <Text style={styles.errorSubText}>Vui lòng kiểm tra kết nối mạng và thử lại.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadFeed(selectedCategory)}
          >
            <RotateCcw size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
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
                onPress={handleOpenCreatePostCheck}
              >
                <Image
                  source={{ uri: profileAvatar }}
                  style={styles.composerAvatar}
                />
                <Text style={styles.composerPlaceholder}>
                  {profileName} ơi, chia sẻ góc xanh hoặc khoe cây của bạn...
                </Text>
              </TouchableOpacity>

              <View style={styles.composerDivider} />

              <View style={styles.composerActions}>
                <TouchableOpacity
                  style={styles.composerActionBtn}
                  onPress={handleOpenCreatePostCheck}
                >
                  <ImagePlus size={18} color="#2E7D32" />
                  <Text style={styles.composerActionText}>Ảnh/Đánh giá</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.composerActionBtn}
                  onPress={handleOpenCreatePostCheck}
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
        defaultCategory={selectedCategory !== "Tất cả" ? selectedCategory : "Khoe cây 🌿"}
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
        onCommentCountChange={(delta) => handleCommentCountChange(commentModalState.reviewId, delta)}
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
    paddingBottom: 100
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
    marginRight: 12,
    backgroundColor: "#E8F5E9"
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 16
  },
  errorSubText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22
  },
  retryBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14
  }
});
