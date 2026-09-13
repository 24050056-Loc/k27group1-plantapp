import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import { X, Send, CornerDownRight, Heart, ChevronDown, ChevronUp } from "lucide-react-native";
import { ReviewComment } from "../../../types/review";
import { getReviewComments, postReviewComment, resolveImageUrl } from "../../../services/reviewService";
import { useAuth } from "../../../context/AuthContext";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

type CommentSheetModalProps = {
  visible: boolean;
  reviewId: number;
  onClose: () => void;
  onCommentCountChange?: (countDelta: number) => void;
};

// Component riêng cho từng comment để có state like độc lập
const CommentItem: React.FC<{
  item: ReviewComment;
  onReply: (c: ReviewComment) => void;
}> = ({ item, onReply }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.like_count || 0);
  const [showReplies, setShowReplies] = useState(true);
  const heartScale = useRef(new Animated.Value(1)).current;
  const avatarUri = resolveImageUrl(item.user_avatar) || DEFAULT_AVATAR;

  const handleLike = () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, tension: 200, friction: 4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true })
    ]).start();
  };

  const replies = item.replies || [];

  return (
    <View style={styles.commentContainer}>
      {/* Avatar */}
      <Image source={{ uri: avatarUri }} style={styles.avatar} />

      <View style={styles.commentBody}>
        {/* Bubble */}
        <View style={styles.bubble}>
          <Text style={styles.userName}>{item.user_name}</Text>
          <Text style={styles.commentContent}>{item.noi_dung}</Text>
        </View>

        {/* Actions Row */}
        <View style={styles.commentActions}>
          <Text style={styles.timeText}>{item.created_at}</Text>

          <TouchableOpacity onPress={handleLike} style={styles.miniAction}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={12}
                color={liked ? "#E53935" : "#999"}
                fill={liked ? "#E53935" : "transparent"}
              />
            </Animated.View>
            {likeCount > 0 && (
              <Text style={[styles.miniActionText, liked && { color: "#E53935" }]}>{likeCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onReply(item)}
            style={styles.miniAction}
          >
            <Text style={styles.replyButtonText}>Trả lời</Text>
          </TouchableOpacity>
        </View>

        {/* Nested Replies */}
        {replies.length > 0 && (
          <View style={styles.repliesSection}>
            {/* Toggle replies header */}
            <TouchableOpacity
              style={styles.toggleRepliesBtn}
              onPress={() => setShowReplies((p) => !p)}
            >
              {showReplies ? (
                <ChevronUp size={13} color="#2E7D32" />
              ) : (
                <ChevronDown size={13} color="#2E7D32" />
              )}
              <Text style={styles.toggleRepliesText}>
                {showReplies ? "Ẩn" : "Xem"} {replies.length} phản hồi
              </Text>
            </TouchableOpacity>

            {showReplies && (
              <View style={styles.repliesList}>
                {replies.map((reply) => (
                  <ReplyItem key={reply.id} reply={reply} onReply={() => onReply(item)} />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const ReplyItem: React.FC<{
  reply: ReviewComment;
  onReply: () => void;
}> = ({ reply, onReply }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reply.like_count || 0);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, tension: 200, friction: 4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true })
    ]).start();
  };

  return (
    <View style={styles.replyItem}>
      <CornerDownRight size={13} color="#C8E6C9" style={{ marginRight: 4, marginTop: 6 }} />
      <Image
        source={{ uri: resolveImageUrl(reply.user_avatar) || DEFAULT_AVATAR }}
        style={styles.replyAvatar}
      />
      <View style={styles.replyBody}>
        <View style={[styles.bubble, styles.replyBubble]}>
          <Text style={styles.userName}>{reply.user_name}</Text>
          <Text style={styles.commentContent}>{reply.noi_dung}</Text>
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.timeText}>{reply.created_at}</Text>
          <TouchableOpacity onPress={handleLike} style={styles.miniAction}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={11}
                color={liked ? "#E53935" : "#999"}
                fill={liked ? "#E53935" : "transparent"}
              />
            </Animated.View>
            {likeCount > 0 && (
              <Text style={[styles.miniActionText, liked && { color: "#E53935" }]}>{likeCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onReply} style={styles.miniAction}>
            <Text style={styles.replyButtonText}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const CommentSheetModal: React.FC<CommentSheetModalProps> = ({
  visible,
  reviewId,
  onClose,
  onCommentCountChange
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<ReviewComment | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sheet slide animation
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible && reviewId) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true
      }).start();
      loadComments();
    } else {
      setComments([]);
      setReplyTo(null);
      setInputText("");
      slideAnim.setValue(300);
    }
  }, [visible, reviewId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getReviewComments(reviewId);
      setComments(data);
    } catch (error) {
      console.error("Lỗi load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để gửi bình luận.");
      return;
    }

    if (!inputText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const newComment = await postReviewComment(
        reviewId,
        inputText.trim(),
        replyTo ? replyTo.id : null
      );

      if (newComment) {
        if (replyTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c
            )
          );
        } else {
          setComments((prev) => [newComment, ...prev]);
        }
        onCommentCountChange?.(1);
        setInputText("");
        setReplyTo(null);
      }
    } catch (err: any) {
      console.error("Lỗi gửi bình luận:", err);
      const msg = err?.response?.data?.message || "Không thể gửi bình luận. Vui lòng thử lại.";
      Alert.alert("Bình luận thất bại", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 220,
      useNativeDriver: true
    }).start(onClose);
  };

  const handleSetReply = (comment: ReviewComment) => {
    setReplyTo(comment);
    setInputText(`@${comment.user_name} `);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Bình luận
              {comments.length > 0 && (
                <Text style={styles.titleCount}> ({comments.length})</Text>
              )}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Đang tải bình luận...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Chưa có bình luận nào</Text>
              <Text style={styles.emptyText}>Hãy là người đầu tiên bình luận!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <CommentItem item={item} onReply={handleSetReply} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Reply Banner */}
          {replyTo && (
            <View style={styles.replyBanner}>
              <View style={styles.replyBannerLeft}>
                <CornerDownRight size={14} color="#2E7D32" />
                <Text style={styles.replyBannerText}>
                  Đang trả lời <Text style={{ fontWeight: "700" }}>{replyTo.user_name}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setReplyTo(null); setInputText(""); }}
                style={styles.cancelReplyBtn}
              >
                <X size={14} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            {user?.avatar ? (
              <Image
                source={{ uri: resolveImageUrl(user.avatar) || DEFAULT_AVATAR }}
                style={styles.inputAvatar}
              />
            ) : (
              <View style={[styles.inputAvatar, styles.inputAvatarPlaceholder]}>
                <Text style={{ fontSize: 16 }}>👤</Text>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder={
                replyTo
                  ? `Trả lời ${replyTo.user_name}...`
                  : user
                  ? "Viết bình luận..."
                  : "Đăng nhập để bình luận..."
              }
              placeholderTextColor="#AAA"
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!submitting}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || submitting) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)"
  },
  sheetContainer: {
    maxHeight: "80%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2"
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A2E1A"
  },
  titleCount: {
    fontSize: 15,
    fontWeight: "500",
    color: "#888"
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingContainer: {
    flex: 1,
    minHeight: 160,
    justifyContent: "center",
    alignItems: "center",
    gap: 10
  },
  loadingText: {
    fontSize: 13,
    color: "#888"
  },
  emptyContainer: {
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 6
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 4
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444"
  },
  emptyText: {
    color: "#888",
    fontSize: 13,
    textAlign: "center"
  },
  listContent: {
    padding: 16,
    paddingBottom: 8
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: 18
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#E8F5E9",
    flexShrink: 0
  },
  commentBody: {
    flex: 1
  },
  bubble: {
    backgroundColor: "#F3F4F3",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  replyBubble: {
    backgroundColor: "#F8FBF8",
    borderWidth: 1,
    borderColor: "#E8F5E9"
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 3
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 19
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
    marginLeft: 6
  },
  timeText: {
    fontSize: 11,
    color: "#999"
  },
  miniAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  miniActionText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600"
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32"
  },
  repliesSection: {
    marginTop: 10
  },
  toggleRepliesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    marginLeft: 4
  },
  toggleRepliesText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32"
  },
  repliesList: {
    marginLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#E8F5E9",
    paddingLeft: 10
  },
  replyItem: {
    flexDirection: "row",
    marginBottom: 12
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: "#E8F5E9",
    flexShrink: 0
  },
  replyBody: {
    flex: 1
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F8F1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8F5E9"
  },
  replyBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  replyBannerText: {
    fontSize: 13,
    color: "#2E7D32"
  },
  cancelReplyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 8
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    flexShrink: 0
  },
  inputAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center"
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    maxHeight: 100,
    fontSize: 14,
    color: "#333"
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0
  },
  sendButtonDisabled: {
    backgroundColor: "#A5D6A7"
  }
});
