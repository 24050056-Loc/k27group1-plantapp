import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { CheckCircle2, PackageCheck } from "lucide-react-native";

type Props = { 
  orderId: number | null;
  amount?: number;
  onBack: () => void; 
};

export default function PaymentCODScreen({ orderId, amount, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <PackageCheck size={48} stroke="#2E7D32" />
      </View>

      <Text style={styles.title}>Đặt hàng thành công! 🎉</Text>
      <Text style={styles.orderLabel}>Mã đơn hàng: #{orderId || "N/A"}</Text>

      {amount !== undefined && amount > 0 && (
        <View style={styles.amountCard}>
          <Text style={styles.amountTitle}>Số tiền thanh toán khi nhận hàng:</Text>
          <Text style={styles.amountText}>{amount.toLocaleString("vi-VN")}đ</Text>
        </View>
      )}

      <Text style={styles.description}>
        Đơn hàng của bạn đã được ghi nhận. Nhân viên giao hàng sẽ thu tiền mặt khi giao hàng đến địa chỉ của bạn.
      </Text>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Về Trang Chủ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: Platform.OS === "android" ? 56 : 60, backgroundColor: "#F8FAF5", alignItems: "center" },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8, color: "#2E7D32", textAlign: "center" },
  orderLabel: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 20 },
  amountCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5EBE1",
    marginBottom: 20,
  },
  amountTitle: { fontSize: 13, color: "#666" },
  amountText: { fontSize: 22, fontWeight: "800", color: "#2E7D32", marginTop: 4 },
  description: { fontSize: 14, color: "#666", lineHeight: 22, marginBottom: 32, textAlign: "center" },
  backButton: { backgroundColor: "#2E7D32", borderRadius: 16, paddingVertical: 16, width: "100%", alignItems: "center" },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
