import React, { useState, useEffect } from "react";
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
  ActivityIndicator
} from "react-native";
import { X, Send, CornerDownRight } from "lucide-react-native";
import { ReviewComment } from "../../../types/review";
import { getReviewComments, postReviewComment } from "../../../services/reviewService";

type CommentSheetModalProps = {
  visible: boolean;
  reviewId: number;
  onClose: () => void;
  onCommentCountChange?: (countDelta: number) => void;
};

export const CommentSheetModal: React.FC<CommentSheetModalProps> = ({
  visible,
  reviewId,
  onClose,
  onCommentCountChange
}) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<ReviewComment | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible && reviewId) {
      loadComments();
    } else {
      setComments([]);
      setReplyTo(null);
      setInputText("");
    }
  }, [visible, reviewId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await getReviewComments(reviewId);
    setComments(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || submitting) return;

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
    setSubmitting(false);
  };

  const renderCommentItem = ({ item }: { item: ReviewComment }) => {
    return (
      <View style={styles.commentContainer}>
        <Image
          source={{
            uri: item.user_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          }}
          style={styles.avatar}
        />
        <View style={styles.commentBody}>
          <View style={styles.bubble}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.commentContent}>{item.noi_dung}</Text>
          </View>

          <View style={styles.commentActions}>
            <Text style={styles.timeText}>{item.created_at}</Text>
            <TouchableOpacity
              onPress={() => {
                setReplyTo(item);
                setInputText(`@${item.user_name} `);
              }}
            >
              <Text style={styles.replyButtonText}>Trả lời</Text>
            </TouchableOpacity>
          </View>

          {/* Nested Replies (Level 2) */}
          {item.replies && item.replies.length > 0 && (
            <View style={styles.repliesList}>
              {item.replies.map((reply) => (
                <View key={reply.id} style={styles.replyItem}>
                  <CornerDownRight size={14} color="#999" style={{ marginRight: 6, marginTop: 4 }} />
                  <Image
                    source={{
                      uri: reply.user_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                    }}
                    style={styles.replyAvatar}
                  />
                  <View style={styles.replyBody}>
                    <View style={styles.bubble}>
                      <Text style={styles.userName}>{reply.user_name}</Text>
                      <Text style={styles.commentContent}>{reply.noi_dung}</Text>
                    </View>
                    <Text style={styles.timeText}>{reply.created_at}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bình luận</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCommentItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Reply Banner Indicator */}
          {replyTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText}>
                Đang trả lời <Text style={{ fontWeight: "700" }}>{replyTo.user_name}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <X size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={replyTo ? `Trả lời ${replyTo.user_name}...` : "Viết bình luận..."}
              value={inputText}
              onChangeText={setInputText}
              multiline
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
                <Send size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.4)"
  },
  sheetContainer: {
    height: "70%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E1A"
  },
  closeButton: {
    padding: 4
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center"
  },
  listContent: {
    padding: 16
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: 16
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  commentBody: {
    flex: 1
  },
  bubble: {
    backgroundColor: "#F2F4F2",
    borderRadius: 16,
    padding: 12
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 4
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
    marginLeft: 8
  },
  timeText: {
    fontSize: 11,
    color: "#888"
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32"
  },
  repliesList: {
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#E0E0E0",
    paddingLeft: 8
  },
  replyItem: {
    flexDirection: "row",
    marginTop: 8
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8
  },
  replyBody: {
    flex: 1
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  replyBannerText: {
    fontSize: 12,
    color: "#2E7D32"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEE"
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    marginLeft: 10
  },
  sendButtonDisabled: {
    backgroundColor: "#A5D6A7"
  }
});
