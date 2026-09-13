import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  Gift,
  Sparkles,
  Copy,
  CheckCircle2,
  Share2,
  X,
  Sprout,
  Trophy,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HarvestCelebrationModalProps = {
  visible: boolean;
  seedName: string;
  stageLabel: string;
  stageEmoji?: string;
  voucherCode: string;
  voucherLabel: string;
  voucherDesc?: string;
  onClose: () => void;
  onOneClickShare: () => void;
  sharing?: boolean;
  onStartNewSeed: () => void;
  onCopyCode: (code: string) => void;
};

export const HarvestCelebrationModal: React.FC<HarvestCelebrationModalProps> = ({
  visible,
  seedName,
  stageLabel,
  stageEmoji = "🌺",
  voucherCode,
  voucherLabel,
  voucherDesc,
  onClose,
  onOneClickShare,
  sharing = false,
  onStartNewSeed,
  onCopyCode,
}) => {
  const [copied, setCopied] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCopied(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -6, duration: 600, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 200, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleCopy = () => {
    onCopyCode(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Nút đóng góc phải */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#757575" />
            </TouchableOpacity>

            {/* Header Icon Chúc Mừng */}
            <View style={styles.headerIconContainer}>
              <Animated.View style={[styles.trophyCircle, { transform: [{ translateY: bounceAnim }] }]}>
                <Trophy size={38} color="#FF8F00" />
              </Animated.View>
              <View style={styles.sparkleBadge}>
                <Sparkles size={16} color="#FFD54F" />
              </View>
            </View>

            {/* Tiêu đề chúc mừng */}
            <Text style={styles.congratsBadge}>🎉 THU HOẠCH THÀNH CÔNG 🎉</Text>
            <Text style={styles.title}>Chúc mừng bạn!</Text>
            <Text style={styles.subtitle}>
              Cây <Text style={styles.plantHighlight}>"{seedName || "Cây Xanh"}"</Text> của bạn đã hoàn thành giai đoạn{" "}
              <Text style={styles.stageHighlight}>{stageLabel} {stageEmoji}</Text> và mang về phần thưởng tuyệt vời!
            </Text>

            {/* Khối hiển thị Voucher nhận được */}
            <View style={styles.voucherBox}>
              <View style={styles.voucherLeft}>
                <View style={styles.voucherIconCircle}>
                  <Gift size={22} color="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.voucherLabel}>{voucherLabel}</Text>
                  <Text style={styles.voucherDesc}>
                    {voucherDesc || "Đã tự động lưu vào Ví Voucher của bạn"}
                  </Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>Mã: {voucherCode}</Text>
                    <TouchableOpacity
                      style={[styles.copyPill, copied && styles.copyPillSuccess]}
                      onPress={handleCopy}
                      activeOpacity={0.8}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 size={12} color="#fff" />
                          <Text style={styles.copyPillTextSuccess}>Đã sao chép</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={12} color="#2E7D32" />
                          <Text style={styles.copyPillText}>Chép mã</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Nút 1-Click Khoe Cây Lên Feed */}
            <TouchableOpacity
              style={styles.shareFeedBtn}
              onPress={onOneClickShare}
              disabled={sharing}
              activeOpacity={0.85}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Share2 size={18} color="#fff" />
                  <Text style={styles.shareFeedText}>1-Click Khoe Cây Lên Feed</Text>
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>+ Nhiệm vụ</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Nút Trồng Cây Mới */}
            <TouchableOpacity
              style={styles.newSeedBtn}
              onPress={onStartNewSeed}
              activeOpacity={0.85}
            >
              <Sprout size={18} color="#2E7D32" />
              <Text style={styles.newSeedText}>Tiếp tục trồng cây mới</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    paddingTop: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerIconContainer: {
    position: "relative",
    marginBottom: 12,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF8E1",
    borderWidth: 3,
    borderColor: "#FFE082",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#FF6F00",
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  congratsBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#E65100",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2E1A",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#556b55",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  plantHighlight: {
    color: "#2E7D32",
    fontWeight: "700",
  },
  stageHighlight: {
    color: "#E65100",
    fontWeight: "700",
  },
  voucherBox: {
    width: "100%",
    backgroundColor: "#F4FAF3",
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
    borderRadius: 18,
    borderStyle: "dashed",
    padding: 14,
    marginBottom: 18,
  },
  voucherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  voucherIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  voucherLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2E7D32",
  },
  voucherDesc: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A2E1A",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  copyPillSuccess: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  copyPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
  },
  copyPillTextSuccess: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  shareFeedBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  shareFeedText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  hotBadge: {
    backgroundColor: "#FFE082",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#E65100",
  },
  newSeedBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0F7ED",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    paddingVertical: 13,
    borderRadius: 16,
  },
  newSeedText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "700",
  },
});
