import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { Bell, Droplets, Sun, Moon, Check, X, ShieldCheck } from "lucide-react-native";

type WaterReminderModalProps = {
  visible: boolean;
  notifOn: boolean;
  onClose: () => void;
  onSaveReminder: (enabled: boolean, morning: boolean, evening: boolean) => Promise<void>;
};

export const WaterReminderModal: React.FC<WaterReminderModalProps> = ({
  visible,
  notifOn,
  onClose,
  onSaveReminder,
}) => {
  const [enabled, setEnabled] = useState(notifOn);
  const [remindMorning, setRemindMorning] = useState(true);
  const [remindEvening, setRemindEvening] = useState(true);
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setEnabled(notifOn);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 75, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 250, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, notifOn]);

  const handleToggleMain = (val: boolean) => {
    setEnabled(val);
    if (val && !remindMorning && !remindEvening) {
      setRemindMorning(true);
      setRemindEvening(true);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const isActuallyEnabled = enabled && (remindMorning || remindEvening);
      await onSaveReminder(isActuallyEnabled, remindMorning, remindEvening);
      onClose();
    } catch (error) {
      console.error("Lỗi lưu nhắc nhở:", error);
      Alert.alert("Lỗi", "Không thể lưu cài đặt nhắc nhở. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <View style={styles.centerContainer}>
          <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
            {/* Nút đóng góc phải */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#757575" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.headerIconCircle}>
              <Bell size={28} color="#2E7D32" />
            </View>
            <Text style={styles.title}>Nhắc nhở tưới cây</Text>
            <Text style={styles.subtitle}>
              Nhận thông báo định kỳ hằng ngày để không bỏ lỡ các đợt tưới nước giúp cây ảo mau lớn và sớm nhận voucher.
            </Text>

            {/* Công tắc chính: Bật / Tắt */}
            <View style={styles.mainToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mainToggleLabel}>Bật nhắc nhở hằng ngày</Text>
                <Text style={styles.mainToggleSub}>
                  {enabled ? "Thông báo sẽ tự động gửi đến máy của bạn" : "Tạm dừng tất cả thông báo nhắc nhở"}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggleMain}
                trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
                thumbColor={enabled ? "#2E7D32" : "#BDBDBD"}
              />
            </View>

            {/* Các khung giờ nhắc */}
            {enabled && (
              <View style={styles.timeSlotsContainer}>
                <Text style={styles.timeSlotsHeader}>Khung giờ nhắc nhở trong ngày:</Text>

                {/* Khung sáng: 08:00 */}
                <TouchableOpacity
                  style={[styles.slotCard, remindMorning && styles.slotCardActive]}
                  onPress={() => setRemindMorning(!remindMorning)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.slotIconBox, { backgroundColor: "#FFF8E1" }]}>
                    <Sun size={20} color="#F57F17" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotTitle}>Buổi sáng · 08:00</Text>
                    <Text style={styles.slotDesc}>Đón nắng sớm và bắt đầu ngày mới cho cây</Text>
                  </View>
                  <View style={[styles.checkCircle, remindMorning && styles.checkCircleActive]}>
                    {remindMorning && <Check size={14} color="#fff" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                {/* Khung chiều: 18:00 */}
                <TouchableOpacity
                  style={[styles.slotCard, remindEvening && styles.slotCardActive]}
                  onPress={() => setRemindEvening(!remindEvening)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.slotIconBox, { backgroundColor: "#E3F2FD" }]}>
                    <Moon size={20} color="#1565C0" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotTitle}>Buổi chiều · 18:00</Text>
                    <Text style={styles.slotDesc}>Tưới nước thư giãn sau một ngày làm việc</Text>
                  </View>
                  <View style={[styles.checkCircle, remindEvening && styles.checkCircleActive]}>
                    {remindEvening && <Check size={14} color="#fff" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Ghi chú an toàn bảo mật */}
            <View style={styles.securityBox}>
              <ShieldCheck size={15} color="#2E7D32" />
              <Text style={styles.securityText}>
                Thông báo cục bộ (Local Notification) bảo mật, không gây phiền và hoạt động ngay cả khi ngoại tuyến.
              </Text>
            </View>

            {/* Nút Lưu cài đặt */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Đang lưu cài đặt..." : "Lưu cài đặt nhắc nhở"}
              </Text>
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
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 7,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2E1A",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12.5,
    color: "#556b55",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  mainToggleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAF7",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5EBE1",
    marginBottom: 14,
  },
  mainToggleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  mainToggleSub: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  timeSlotsContainer: {
    width: "100%",
    gap: 10,
    marginBottom: 14,
  },
  timeSlotsHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#424242",
    marginBottom: 2,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
  },
  slotCardActive: {
    backgroundColor: "#F4FAF3",
    borderColor: "#A5D6A7",
  },
  slotIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  slotDesc: {
    fontSize: 11,
    color: "#616161",
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#BDBDBD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkCircleActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F1F8F1",
    borderRadius: 12,
    padding: 10,
    width: "100%",
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: "#2E7D32",
    lineHeight: 15,
  },
  saveBtn: {
    width: "100%",
    backgroundColor: "#2E7D32",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
