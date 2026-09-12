import React, { useState } from "react";
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
  Alert
} from "react-native";
import { X, Star, ImagePlus, Send, Sparkles } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { createReview } from "../../../services/reviewService";
import { Review } from "../../../types/review";
import { useAuth } from "../../../context/AuthContext";

const normalizeAvatarUrl = (value?: string | null, fallback = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150") => {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const driveMatch = trimmed.match(/(?:\/d\/|id=)([A-Za-z0-9_-]{10,})/);
  if (driveMatch?.[1] && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  return trimmed;
};

type CreatePostModalProps = {
  visible: boolean;
  onClose: () => void;
  onPostSuccess?: (newReview: Review) => void;
  defaultCategory?: string;
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostSuccess,
  defaultCategory = "Mới nhất"
}) => {
  const { user } = useAuth();
  const profileName = user?.ho_ten || user?.ten_dang_nhap || "Bạn";
  const profileAvatar = normalizeAvatarUrl(user?.avatar);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    defaultCategory && defaultCategory !== "Tất cả" && defaultCategory !== "Mới nhất" ? defaultCategory : "Khoe cây 🌿"
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handlePickImages = async () => {
    if (images.length >= 5) {
      Alert.alert("Giới hạn ảnh", "Bạn chỉ được chọn tối đa 5 hình ảnh cho 1 bài viết.");
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
      quality: 0.8,
      selectionLimit: 5 - images.length
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nội dung bài viết.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    const newReview = await createReview(
      {
        user_id: user?.id || 1,
        so_sao: rating,
        noi_dung: content.trim(),
        images: images,
        category_tag: selectedCategory
      },
      (progress) => setUploadProgress(progress)
    );

    setSubmitting(false);
    setUploadProgress(0);

    if (newReview) {
      onPostSuccess?.(newReview);
      handleResetAndClose();
    }
  };

  const handleResetAndClose = () => {
    setRating(5);
    setContent("");
    setImages([]);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleResetAndClose}>
      <SafeAreaView style={styles.container}>
        {/* Header với nút đóng (X) */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleResetAndClose}>
            <X size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo Bài Viết & Đánh Giá</Text>
          <TouchableOpacity
            style={[styles.postButton, (!content.trim() || submitting) && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.postButtonText}>Đăng</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* User Preview Header */}
          <View style={styles.userRow}>
            <Image
              source={{ uri: profileAvatar }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>{profileName}</Text>
              <View style={styles.tagBadge}>
                <Sparkles size={12} color="#2E7D32" />
                <Text style={styles.tagText}>{selectedCategory}</Text>
              </View>
            </View>
          </View>

          {/* Chọn danh mục bài viết */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>Chọn danh mục bài viết:</Text>
            <View style={styles.categoryRow}>
              {["Khoe cây 🌿", "Đánh giá hot", "Mẹo chăm sóc"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Stars Picker */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Đánh giá số sao:</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ padding: 4 }}>
                  <Star
                    size={32}
                    color={star <= rating ? "#FFC107" : "#E0E0E0"}
                    fill={star <= rating ? "#FFC107" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Input Text Area */}
          <TextInput
            style={styles.contentInput}
            placeholder="Chia sẻ góc xanh, trải nghiệm trồng cây hoặc đánh giá sản phẩm của bạn..."
            placeholderTextColor="#888"
            multiline
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />

          {/* Image Picker Trigger & Progress Bar */}
          <View style={styles.mediaHeader}>
            <Text style={styles.sectionLabel}>Hình ảnh ({images.length}/5):</Text>
            <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImages}>
              <ImagePlus size={18} color="#2E7D32" style={{ marginRight: 6 }} />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>

          {submitting && uploadProgress > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Đang tải bài viết: {uploadProgress}%</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          )}

          {/* Image Grid Preview with Delete Button (X) */}
          <View style={styles.imageGrid}>
            {images.map((uri, idx) => (
              <View key={`${uri}-${idx}`} style={styles.imagePreviewWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => handleRemoveImage(idx)}>
                  <X size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE"
  },
  closeButton: {
    padding: 6
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A"
  },
  postButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20
  },
  postButtonDisabled: {
    backgroundColor: "#A5D6A7"
  },
  postButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14
  },
  body: {
    padding: 16
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E1A"
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start"
  },
  tagText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
    marginLeft: 4
  },
  categorySection: {
    marginBottom: 16
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  catChipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32"
  },
  catChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500"
  },
  catChipTextActive: {
    color: "#2E7D32",
    fontWeight: "700"
  },
  ratingSection: {
    backgroundColor: "#F9FBF9",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: "center"
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6
  },
  starsRow: {
    flexDirection: "row"
  },
  contentInput: {
    fontSize: 15,
    color: "#333",
    minHeight: 120,
    lineHeight: 22,
    marginBottom: 16
  },
  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  addImageText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600"
  },
  progressContainer: {
    marginBottom: 16
  },
  progressText: {
    fontSize: 12,
    color: "#2E7D32",
    marginBottom: 4
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2E7D32"
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  imagePreviewWrapper: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative"
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  removeImgBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center"
  }
});
