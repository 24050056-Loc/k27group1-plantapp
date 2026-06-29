import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = { 
  orderId: number | null;
  onBack: () => void; 
};

export default function PaymentCODScreen({ orderId, onBack }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt hàng thành công! 🎉</Text>
      <Text style={styles.orderLabel}>Mã đơn hàng của bạn: #{orderId || "N/A"}</Text>
      <Text style={styles.description}>
        Đơn hàng đã được ghi nhận. Nhân viên giao hàng sẽ thu tiền mặt khi đơn hàng được giao tới địa chỉ của bạn.
      </Text>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Về Trang Chủ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 12, color: "#2E7D32" },
  orderLabel: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 18 },
  description: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 32 },
  backButton: { backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});

