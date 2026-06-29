import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

type Props = { 
  orderId: number | null;
  onBack: () => void; 
};

export default function PaymentQRScreen({ orderId, onBack }: Props) {
  // Tạo link mã QR thanh toán nhanh qua VietQR (tích hợp mã đơn hàng và text động)
  const vietQrUrl = `https://img.vietqr.io/image/970418-0123456789-compact.png?amount=100000&addInfo=PLANTAPP%20${orderId || 0}&accountName=TREE%20SHOP`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quét mã chuyển khoản QR 📲</Text>
      <Text style={styles.orderLabel}>Đơn hàng #{orderId || "N/A"}</Text>
      
      <View style={styles.qrContainer}>
        <Image 
          source={{ uri: vietQrUrl }} 
          style={styles.qrImage} 
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Hướng dẫn chuyển khoản:</Text>
        <Text style={styles.infoText}>• Ngân hàng: BIDV (970418)</Text>
        <Text style={styles.infoText}>• Số tài khoản: 0123456789</Text>
        <Text style={styles.infoText}>• Chủ tài khoản: CỬA HÀNG CÂY CẢNH TREE SHOP</Text>
        <Text style={[styles.infoText, styles.highlightText]}>
          • Nội dung chuyển khoản: <Text style={styles.codeText}>PLANTAPP {orderId}</Text>
        </Text>
      </View>

      <Text style={styles.description}>
        Vui lòng quét mã QR ở trên hoặc chuyển khoản thủ công đúng thông tin hướng dẫn để đơn hàng được duyệt nhanh chóng.
      </Text>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Tôi đã chuyển khoản thành công</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 6, color: "#1A2E1A" },
  orderLabel: { fontSize: 18, fontWeight: "700", color: "#2E7D32", marginBottom: 20 },
  qrContainer: { 
    alignSelf: "center", 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: "#eee",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  qrImage: { width: 200, height: 200 },
  infoCard: { backgroundColor: "#f9f9f9", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eee", marginBottom: 20 },
  infoTitle: { fontWeight: "700", color: "#333", marginBottom: 8, fontSize: 14 },
  infoText: { fontSize: 13, color: "#555", lineHeight: 20 },
  highlightText: { fontWeight: "600", color: "#333" },
  codeText: { color: "#d32f2f", fontWeight: "700" },
  description: { fontSize: 13, color: "#777", lineHeight: 20, marginBottom: 28, textAlign: "center" },
  backButton: { backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});

