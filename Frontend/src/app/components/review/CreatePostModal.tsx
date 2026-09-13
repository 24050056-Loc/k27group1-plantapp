import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import {
  X,
  Star,
  ImagePlus,
  Sparkles,
  Camera,
  Send,
  CheckCircle2,
  Trash2
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { createReview, resolveImageUrl } from "../../../services/reviewService";
import { Review } from "../../../types/review";
import { useAuth } from "../../../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_IMAGES = 5;

const STAR_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Rất tệ",       color: "#F44336", emoji: "😞" },
  2: { label: "Tệ",           color: "#FF7043", emoji: "😕" },
  3: { label: "Bình thường",  color: "#FFC107", emoji: "😐" },
  4: { label: "Tốt",          color: "#66BB6A", emoji: "😊" },
  5: { label: "Xuất sắc!",    color: "#2E7D32", emoji: "🤩" }
};

const CATEGORIES = ["Khoe cây 🌿", "Đánh giá hot", "Mẹo chăm sóc"];

type CreatePostModalProps = {
  visible: boolean;
  onClose: () => void;
  onPostSuccess?: (newReview: Review) => void;
  defaultCategory?: string;
};

// ─── Animated Star Component ───────────────────────────────────────────────────
const AnimatedStar: React.FC<{
  index: number;
  filled: boolean;
  onPress: () => void;
}> = ({ index, filled, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.5,
        tension: 300,
        friction: 4,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true
      })
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.starTouchable}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Star
          size={38}
          color={filled ? "#FFC107" : "#DDD"}
          fill={filled ? "#FFC107" : "transparent"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Upload Progress Bar Component ────────────────────────────────────────────
const UploadProgressBar: React.FC<{ progress: number; visible: boolean }> = ({
  progress,
  visible
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [progress]);

  useEffect(() => {
    if (visible && progress < 100) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true
        })
      ).start();
    } else {
      shimmerAnim.setValue(-1);
    }
  }, [visible, progress]);

  if (!visible) return null;

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.6]
  });

  return (
    <View style={progressStyles.wrapper}>
      <View style={progressStyles.labelRow}>
        <View style={progressStyles.labelLeft}>
          {progress >= 100 ? (
            <CheckCircle2 size={14} color="#2E7D32" />
          ) : (
            <ActivityIndicator size="small" color="#2E7D32" style={{ transform: [{ scale: 0.7 }] }} />
          )}
          <Text style={progressStyles.labelText}>
            {progress >= 100 ? "Đăng thành công! 🎉" : `Đang tải lên... ${progress}%`}
          </Text>
        </View>
        <Text style={progressStyles.percentText}>{progress}%</Text>
      </View>

      <View style={progressStyles.trackBg}>
        <Animated.View
          style={[
            progressStyles.trackFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"]
              }),
              backgroundColor: progress >= 100 ? "#2E7D32" : "#43A047"
            }
          ]}
        >
          {/* Shimmer overlay */}
          {progress < 100 && (
            <Animated.View
              style={[
                progressStyles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] }
              ]}
            />
          )}
        </Animated.View>
      </View>

      {/* Step indicators */}
      <View style={progressStyles.stepsRow}>
        {["Chuẩn bị", "Ảnh", "Bài viết", "Hoàn tất"].map((step, idx) => {
          const stepProgress = (idx + 1) * 25;
          const done = progress >= stepProgress;
          return (
            <View key={step} style={progressStyles.step}>
              <View
                style={[
                  progressStyles.stepDot,
                  done ? progressStyles.stepDotDone : progressStyles.stepDotPending
                ]}
              />
              <Text
                style={[
                  progressStyles.stepLabel,
                  done && progressStyles.stepLabelDone
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─── Image Preview Slot ────────────────────────────────────────────────────────
const ImagePreviewSlot: React.FC<{
  uri: string;
  index: number;
  isFirst: boolean;
  onRemove: () => void;
}> = ({ uri, index, isFirst, onRemove }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 7,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.imageSlot,
        isFirst && styles.imageSlotFirst,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

      {/* Cover indicator for first image */}
      {isFirst && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>Ảnh bìa</Text>
        </View>
      )}

      {/* Remove button */}
      <TouchableOpacity
        style={styles.removeImgBtn}
        onPress={onRemove}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Trash2 size={12} color="#FFF" />
      </TouchableOpacity>

      {/* Index badge */}
      <View style={styles.indexBadge}>
        <Text style={styles.indexBadgeText}>{index + 1}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostSuccess,
  defaultCategory = "Khoe cây 🌿"
}) => {
  const { user } = useAuth();
  const profileName = user?.ho_ten || user?.ten_dang_nhap || "Bạn";
  const profileAvatar = resolveImageUrl(user?.avatar);

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    defaultCategory && defaultCategory !== "Tất cả" ? defaultCategory : "Khoe cây 🌿"
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Animated entrance
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true })
      ]).start();
    } else {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handlePickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Giới hạn ảnh", `Bạn chỉ được chọn tối đa ${MAX_IMAGES} hình ảnh cho 1 bài viết.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Ứng dụng cần quyền truy cập thư viện ảnh để đính kèm hình ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_IMAGES - images.length
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  };

  const handleTakePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Giới hạn ảnh", `Bạn chỉ được chọn tối đa ${MAX_IMAGES} hình ảnh.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền camera", "Ứng dụng cần quyền truy cập camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để đăng bài viết.");
      return;
    }
    if (rating === 0) {
      Alert.alert("Thiếu đánh giá", "Vui lòng chọn số sao đánh giá trước khi đăng.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Thiếu nội dung", "Vui lòng nhập nội dung bài viết.");
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(5);

      const newReview = await createReview(
        {
          user_id: user.id,
          so_sao: rating,
          noi_dung: content.trim(),
          images: images,
          category_tag: selectedCategory
        },
        (progress) => setUploadProgress(progress)
      );

      setUploadProgress(100);

      if (newReview) {
        setTimeout(() => {
          onPostSuccess?.(newReview);
          handleResetAndClose();
        }, 800);
      }
    } catch (err: any) {
      console.error("Lỗi đăng bài:", err);
      const msg = err?.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
      Alert.alert("Đăng bài thất bại", msg);
    } finally {
      setTimeout(() => {
        setSubmitting(false);
        setUploadProgress(0);
      }, 900);
    }
  };

  const handleResetAndClose = () => {
    setRating(0);
    setContent("");
    setImages([]);
    onClose();
  };

  const activeRating = hoverRating || rating;
  const starInfo = activeRating > 0 ? STAR_LABELS[activeRating] : null;
  const canSubmit = content.trim().length > 0 && rating > 0 && !submitting;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleResetAndClose}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleResetAndClose}>
              <X size={20} color="#555" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Tạo Bài Viết & Đánh Giá</Text>

            <TouchableOpacity
              style={[styles.postBtn, !canSubmit && styles.postBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <View style={styles.postBtnInner}>
                  <Send size={13} color="#FFF" />
                  <Text style={styles.postBtnText}>Đăng</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Upload Progress ── */}
            <UploadProgressBar progress={uploadProgress} visible={submitting} />

            {/* ── User Row ── */}
            <View style={styles.userRow}>
              <Image
                source={{ uri: profileAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profileName}</Text>
                <View style={styles.categoryBadge}>
                  <Sparkles size={11} color="#2E7D32" />
                  <Text style={styles.categoryBadgeText}>{selectedCategory}</Text>
                </View>
              </View>
            </View>

            {/* ── Category Picker ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📂  Danh mục</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Star Rating ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>⭐  Đánh giá sao</Text>

              <View style={styles.starsContainer}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <AnimatedStar
                      key={star}
                      index={star}
                      filled={star <= activeRating}
                      onPress={() => {
                        setRating(star);
                        setHoverRating(0);
                      }}
                    />
                  ))}
                </View>

                {/* Star label with emoji */}
                {starInfo ? (
                  <View style={[styles.starLabelBadge, { borderColor: starInfo.color + "40", backgroundColor: starInfo.color + "12" }]}>
                    <Text style={styles.starLabelEmoji}>{starInfo.emoji}</Text>
                    <Text style={[styles.starLabelText, { color: starInfo.color }]}>
                      {starInfo.label}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.starPlaceholder}>Chạm để đánh giá</Text>
                )}
              </View>
            </View>

            {/* ── Content Input ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>✏️  Nội dung bài viết</Text>
              <View style={styles.contentInputWrapper}>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Chia sẻ trải nghiệm, mẹo chăm cây hoặc đánh giá sản phẩm của bạn với cộng đồng..."
                  placeholderTextColor="#BBB"
                  multiline
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.charCount}>{content.length}/1000</Text>
              </View>
            </View>

            {/* ── Image Section ── */}
            <View style={styles.section}>
              <View style={styles.imageSectionHeader}>
                <Text style={styles.sectionLabel}>
                  📷  Hình ảnh{" "}
                  <Text style={styles.imageSectionCount}>
                    ({images.length}/{MAX_IMAGES})
                  </Text>
                </Text>
                <View style={styles.imageActionBtns}>
                  <TouchableOpacity
                    style={[styles.imageActionBtn, images.length >= MAX_IMAGES && styles.imageActionBtnDisabled]}
                    onPress={handleTakePhoto}
                    disabled={images.length >= MAX_IMAGES}
                  >
                    <Camera size={15} color={images.length >= MAX_IMAGES ? "#CCC" : "#2E7D32"} />
                    <Text style={[styles.imageActionText, images.length >= MAX_IMAGES && styles.imageActionTextDisabled]}>
                      Chụp
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageActionBtn, images.length >= MAX_IMAGES && styles.imageActionBtnDisabled]}
                    onPress={handlePickImages}
                    disabled={images.length >= MAX_IMAGES}
                  >
                    <ImagePlus size={15} color={images.length >= MAX_IMAGES ? "#CCC" : "#2E7D32"} />
                    <Text style={[styles.imageActionText, images.length >= MAX_IMAGES && styles.imageActionTextDisabled]}>
                      Thư viện
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Image slots */}
              {images.length > 0 ? (
                <View style={styles.imageGrid}>
                  {images.map((uri, idx) => (
                    <ImagePreviewSlot
                      key={`${uri}-${idx}`}
                      uri={uri}
                      index={idx}
                      isFirst={idx === 0}
                      onRemove={() => handleRemoveImage(idx)}
                    />
                  ))}

                  {/* Add more slot */}
                  {images.length < MAX_IMAGES && (
                    <TouchableOpacity style={styles.addMoreSlot} onPress={handlePickImages}>
                      <ImagePlus size={24} color="#A5D6A7" />
                      <Text style={styles.addMoreText}>Thêm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                /* Empty state drop zone */
                <TouchableOpacity style={styles.emptyImageZone} onPress={handlePickImages} activeOpacity={0.7}>
                  <View style={styles.emptyImageIconWrapper}>
                    <ImagePlus size={32} color="#A5D6A7" />
                  </View>
                  <Text style={styles.emptyImageTitle}>Thêm ảnh vào bài viết</Text>
                  <Text style={styles.emptyImageSubtitle}>
                    Tối đa {MAX_IMAGES} ảnh · JPG, PNG được hỗ trợ
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Tips ── */}
            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Mẹo hay</Text>
              <Text style={styles.tipText}>
                Bài viết có ảnh rõ nét và nội dung chi tiết sẽ nhận được nhiều tương tác hơn từ cộng đồng.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Progress Styles ───────────────────────────────────────────────────────────
const progressStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#F1F8F1",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9"
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  labelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32"
  },
  percentText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2E7D32"
  },
  trackBg: {
    height: 8,
    backgroundColor: "#C8E6C9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12
  },
  trackFill: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden"
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "rgba(255,255,255,0.4)"
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  step: {
    alignItems: "center",
    gap: 4
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  stepDotDone: {
    backgroundColor: "#2E7D32"
  },
  stepDotPending: {
    backgroundColor: "#C8E6C9"
  },
  stepLabel: {
    fontSize: 10,
    color: "#AAA",
    fontWeight: "600"
  },
  stepLabelDone: {
    color: "#2E7D32"
  }
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FAFBFA"
  },
  flex: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2E1A"
  },
  postBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    minWidth: 72,
    alignItems: "center"
  },
  postBtnDisabled: {
    backgroundColor: "#C8E6C9"
  },
  postBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  postBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#A5D6A7"
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2E1A",
    marginBottom: 4
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start"
  },
  categoryBadgeText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "700"
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F2F4F2"
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 12
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F4F0",
    borderWidth: 1,
    borderColor: "transparent"
  },
  chipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32"
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666"
  },
  chipTextActive: {
    color: "#2E7D32",
    fontWeight: "800"
  },
  starsContainer: {
    alignItems: "center",
    gap: 12
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center"
  },
  starTouchable: {
    padding: 6
  },
  starLabelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6
  },
  starLabelEmoji: {
    fontSize: 18
  },
  starLabelText: {
    fontSize: 15,
    fontWeight: "800"
  },
  starPlaceholder: {
    fontSize: 13,
    color: "#CCC",
    fontStyle: "italic"
  },
  contentInputWrapper: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 16,
    backgroundColor: "#FAFBFA",
    padding: 14
  },
  contentInput: {
    minHeight: 130,
    fontSize: 15,
    color: "#333",
    lineHeight: 23
  },
  charCount: {
    fontSize: 11,
    color: "#CCC",
    textAlign: "right",
    marginTop: 6
  },
  imageSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },
  imageSectionCount: {
    color: "#AAA",
    fontWeight: "600"
  },
  imageActionBtns: {
    flexDirection: "row",
    gap: 8
  },
  imageActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5
  },
  imageActionBtnDisabled: {
    backgroundColor: "#F5F5F5"
  },
  imageActionText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "700"
  },
  imageActionTextDisabled: {
    color: "#CCC"
  },
  emptyImageZone: {
    height: 140,
    borderWidth: 2,
    borderColor: "#D7EDD7",
    borderStyle: "dashed",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFA",
    gap: 8
  },
  emptyImageIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center"
  },
  emptyImageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888"
  },
  emptyImageSubtitle: {
    fontSize: 11,
    color: "#BBB"
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  imageSlot: {
    width: (SCREEN_WIDTH - 32 - 16 - 10 * 2) / 3,
    height: (SCREEN_WIDTH - 32 - 16 - 10 * 2) / 3,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E8F5E9"
  },
  imageSlotFirst: {
    width: (SCREEN_WIDTH - 32 - 16 - 10) * 0.55,
    height: (SCREEN_WIDTH - 32 - 16 - 10) * 0.55,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4CAF50"
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  coverBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(46,125,50,0.82)",
    paddingVertical: 4,
    alignItems: "center"
  },
  coverBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  removeImgBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center"
  },
  indexBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center"
  },
  indexBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#333"
  },
  addMoreSlot: {
    width: (SCREEN_WIDTH - 32 - 16 - 10 * 2) / 3,
    height: (SCREEN_WIDTH - 32 - 16 - 10 * 2) / 3,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D7EDD7",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFA",
    gap: 4
  },
  addMoreText: {
    fontSize: 11,
    color: "#A5D6A7",
    fontWeight: "700"
  },
  tipBox: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FFE082"
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F57F17",
    marginBottom: 4
  },
  tipText: {
    fontSize: 12,
    color: "#795548",
    lineHeight: 18
  }
});
