import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  Animated
} from "react-native";
import {
  Star,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react-native";
import { Review } from "../../../types/review";
import { toggleReviewLike, resolveImageUrl } from "../../../services/reviewService";
import { useAuth } from "../../../context/AuthContext";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
const DEFAULT_IMAGE_PLACEHOLDER = "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800";

type ReviewCardProps = {
  review: Review;
  onPressImage?: (images: string[], index: number) => void;
  onPressComment?: (reviewId: number) => void;
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onPressImage,
  onPressComment
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(review.is_liked));
  const [likeCount, setLikeCount] = useState<number>(review.so_luong_thich || 0);
  const [commentCount, setCommentCount] = useState<number>(review.comment_count || 0);
  const [expandedText, setExpandedText] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [mediaErrors, setMediaErrors] = useState<Record<number, boolean>>({});

  // Animation refs for heart button
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartParticleY = useRef(new Animated.Value(0)).current;
  const heartParticleOpacity = useRef(new Animated.Value(0)).current;

  // Đồng bộ trạng thái khi props review thay đổi từ API
  useEffect(() => {
    setIsLiked(Boolean(review.is_liked));
    setLikeCount(review.so_luong_thich || 0);
    setCommentCount(review.comment_count || 0);
  }, [review.is_liked, review.so_luong_thich, review.comment_count]);

  const triggerLikeAnimation = (liked: boolean) => {
    if (liked) {
      // Spring bounce khi like
      heartParticleY.setValue(0);
      heartParticleOpacity.setValue(1);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(heartScale, {
            toValue: 1.45,
            tension: 200,
            friction: 4,
            useNativeDriver: true
          }),
          Animated.spring(heartScale, {
            toValue: 1,
            tension: 120,
            friction: 6,
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(heartParticleY, {
            toValue: -28,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(heartParticleOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ])
      ]).start();
    } else {
      // Pulse nhỏ khi unlike
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để thích bài viết này.");
      return;
    }

    // Optimistic Update
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;

    setIsLiked(nextLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    triggerLikeAnimation(nextLiked);

    try {
      const res = await toggleReviewLike(review.id);
      setIsLiked(res.is_liked);
      setLikeCount(res.total_likes);
    } catch (err) {
      // Hoàn tác nếu lỗi
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const reviewText = review.noi_dung || "";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Xem bài viết của ${review.user_name || "Người dùng"} trên PlantApp: "${reviewText}"`
      });
    } catch (error) {
      console.log("Lỗi Native Share:", error);
    }
  };

  const mediaUrls = review.media?.map((m) => resolveImageUrl(m.media_url)).filter(Boolean) || [];

  const handleMediaError = (idx: number) => {
    setMediaErrors((prev) => ({ ...prev, [idx]: true }));
  };

  const renderImageCollage = () => {
    if (mediaUrls.length === 0) return null;

    if (mediaUrls.length === 1) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onPressImage?.(mediaUrls, 0)}
          style={styles.singleImageWrapper}
        >
          <Image
            source={{ uri: mediaErrors[0] ? DEFAULT_IMAGE_PLACEHOLDER : mediaUrls[0] }}
            style={styles.singleImage}
            onError={() => handleMediaError(0)}
          />
        </TouchableOpacity>
      );
    }

    if (mediaUrls.length === 2) {
      return (
        <View style={styles.dualImageRow}>
          {mediaUrls.map((url, idx) => (
            <TouchableOpacity
              key={`${url}-${idx}`}
              activeOpacity={0.9}
              onPress={() => onPressImage?.(mediaUrls, idx)}
              style={styles.halfImageWrapper}
            >
              <Image
                source={{ uri: mediaErrors[idx] ? DEFAULT_IMAGE_PLACEHOLDER : url }}
                style={styles.collageImage}
                onError={() => handleMediaError(idx)}
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (mediaUrls.length === 3) {
      return (
        <View style={styles.tripleImageGrid}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPressImage?.(mediaUrls, 0)}
            style={styles.largeLeftImageWrapper}
          >
            <Image
              source={{ uri: mediaErrors[0] ? DEFAULT_IMAGE_PLACEHOLDER : mediaUrls[0] }}
              style={styles.collageImage}
              onError={() => handleMediaError(0)}
            />
          </TouchableOpacity>
          <View style={styles.rightStackColumn}>
            {mediaUrls.slice(1, 3).map((url, idx) => {
              const actualIdx = idx + 1;
              return (
                <TouchableOpacity
                  key={`${url}-${actualIdx}`}
                  activeOpacity={0.9}
                  onPress={() => onPressImage?.(mediaUrls, actualIdx)}
                  style={styles.halfHeightImageWrapper}
                >
                  <Image
                    source={{ uri: mediaErrors[actualIdx] ? DEFAULT_IMAGE_PLACEHOLDER : url }}
                    style={styles.collageImage}
                    onError={() => handleMediaError(actualIdx)}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // 4 hoặc 5+ ảnh kiểu Collage Facebook
    const displayCount = 4;
    const extraCount = mediaUrls.length - displayCount;

    return (
      <View style={styles.quadGrid}>
        {mediaUrls.slice(0, displayCount).map((url, idx) => {
          const isLast = idx === displayCount - 1 && extraCount > 0;
          return (
            <TouchableOpacity
              key={`${url}-${idx}`}
              activeOpacity={0.9}
              onPress={() => onPressImage?.(mediaUrls, idx)}
              style={styles.quadImageWrapper}
            >
              <Image
                source={{ uri: mediaErrors[idx] ? DEFAULT_IMAGE_PLACEHOLDER : url }}
                style={styles.collageImage}
                onError={() => handleMediaError(idx)}
              />
              {isLast && (
                <View style={styles.overflowOverlay}>
                  <Text style={styles.overflowText}>+{extraCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const avatarUrl = avatarError || !review.user_avatar
    ? DEFAULT_AVATAR
    : resolveImageUrl(review.user_avatar);

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          onError={() => setAvatarError(true)}
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{review.user_name}</Text>
            {review.is_purchased && (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#2E7D32" />
                <Text style={styles.verifiedText}>Đã mua hàng</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeText}>
            {review.created_at} • {review.category_tag || "Khám phá"}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Product & Rating bar */}
      <View style={styles.ratingBar}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              color={star <= review.so_sao ? "#FFC107" : "#E0E0E0"}
              fill={star <= review.so_sao ? "#FFC107" : "transparent"}
            />
          ))}
        </View>
        {review.product_name && (
          <Text style={styles.productTagText} numberOfLines={1}>
            🌱 {review.product_name}
          </Text>
        )}
      </View>

      {/* Content Text */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => setExpandedText(!expandedText)}
        style={styles.contentWrapper}
      >
        <Text
          style={styles.contentText}
          numberOfLines={expandedText ? undefined : 3}
        >
          {reviewText}
        </Text>
        {reviewText.length > 120 && !expandedText && (
          <Text style={styles.readMoreText}>Xem thêm</Text>
        )}
      </TouchableOpacity>

      {/* Image Collage */}
      {renderImageCollage()}

      {/* Stats Counter Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statsLeft}>
          <Heart size={14} color="#E53935" fill="#E53935" />
          <Text style={styles.statsText}>{likeCount}</Text>
        </View>
        <TouchableOpacity onPress={() => onPressComment?.(review.id)}>
          <Text style={styles.statsText}>{commentCount} bình luận</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons Bar */}
      <View style={styles.actionsBar}>
        <View style={styles.likeButtonWrapper}>
          {/* Floating +1 particle */}
          <Animated.Text
            style={[
              styles.likeParticle,
              {
                opacity: heartParticleOpacity,
                transform: [{ translateY: heartParticleY }]
              }
            ]}
          >
            +1
          </Animated.Text>

          <TouchableOpacity style={styles.actionBtn} onPress={handleToggleLike} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={20}
                color={isLiked ? "#E53935" : "#666"}
                fill={isLiked ? "#E53935" : "transparent"}
              />
            </Animated.View>
            <Text style={[styles.actionBtnText, isLiked && styles.likedText]}>
              Thích
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onPressComment?.(review.id)}
        >
          <MessageCircle size={20} color="#666" />
          <Text style={styles.actionBtnText}>Bình luận</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Share2 size={20} color="#666" />
          <Text style={styles.actionBtnText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#E8F5E9"
  },
  headerInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E1A"
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  verifiedText: {
    fontSize: 10,
    color: "#2E7D32",
    fontWeight: "600",
    marginLeft: 3
  },
  timeText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2
  },
  moreButton: {
    padding: 4
  },
  ratingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10
  },
  starsRow: {
    flexDirection: "row"
  },
  productTagText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
    backgroundColor: "#F1F8F1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 200
  },
  contentWrapper: {
    marginBottom: 12
  },
  contentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 21
  },
  readMoreText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "700",
    marginTop: 4
  },
  singleImageWrapper: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#F0F4F0"
  },
  singleImage: {
    width: "100%",
    height: "100%"
  },
  dualImageRow: {
    flexDirection: "row",
    gap: 6,
    height: 180,
    marginBottom: 12
  },
  halfImageWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F4F0"
  },
  collageImage: {
    width: "100%",
    height: "100%"
  },
  tripleImageGrid: {
    flexDirection: "row",
    gap: 6,
    height: 220,
    marginBottom: 12
  },
  largeLeftImageWrapper: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F4F0"
  },
  rightStackColumn: {
    flex: 1,
    gap: 6
  },
  halfHeightImageWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F4F0"
  },
  quadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    height: 220,
    marginBottom: 12
  },
  quadImageWrapper: {
    width: "48.5%",
    height: "48.5%",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F0F4F0"
  },
  overflowOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  overflowText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800"
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 8
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statsText: {
    fontSize: 12,
    color: "#777"
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 4
  },
  likeButtonWrapper: {
    position: "relative",
    alignItems: "center"
  },
  likeParticle: {
    position: "absolute",
    top: -4,
    left: "50%",
    fontSize: 13,
    fontWeight: "800",
    color: "#E53935",
    zIndex: 10
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555"
  },
  likedText: {
    color: "#E53935",
    fontWeight: "700"
  }
});
