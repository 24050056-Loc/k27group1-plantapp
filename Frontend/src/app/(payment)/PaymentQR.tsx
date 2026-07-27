import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from "react-native";
import { QrCode, CheckCircle2, ChevronLeft } from "lucide-react-native";

type Props = { 
  orderId: number | null;
  amount?: number;
  onBack: () => void; 
};

export default function PaymentQRScreen({ orderId, amount = 100000, onBack }: Props) {
  // Link mã QR VietQR động theo đúng số tiền cuối cùng sau giảm giá
  const vietQrUrl = `https://img.vietqr.io/image/970418-0123456789-compact.png?amount=${amount}&addInfo=PLANTAPP%20${orderId || 0}&accountName=TREE%20SHOP`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quét mã chuyển khoản QR 📲</Text>
      <Text style={styles.orderLabel}>Mã đơn hàng #{orderId || "N/A"}</Text>

      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Số tiền cần thanh toán:</Text>
        <Text style={styles.amountValue}>{amount.toLocaleString("vi-VN")}đ</Text>
      </View>
      
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
          • Số tiền: <Text style={styles.codeText}>{amount.toLocaleString("vi-VN")}đ</Text>
        </Text>
        <Text style={[styles.infoText, styles.highlightText]}>
          • Nội dung chuyển khoản: <Text style={styles.codeText}>PLANTAPP {orderId}</Text>
        </Text>
      </View>

      <Text style={styles.description}>
        Vui lòng quét mã QR ở trên hoặc chuyển khoản thủ công đúng số tiền & nội dung để hệ thống tự động xác nhận đơn hàng.
      </Text>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <CheckCircle2 size={18} stroke="#fff" />
        <Text style={styles.backText}>Tôi đã chuyển khoản thành công</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF5" },
  content: { padding: 24, paddingTop: Platform.OS === "android" ? 48 : 52, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4, color: "#1A2E1A" },
  orderLabel: { fontSize: 16, fontWeight: "700", color: "#666", marginBottom: 16 },
  amountBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  amountLabel: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  amountValue: { fontSize: 24, fontWeight: "800", color: "#1B5E20", marginTop: 2 },
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
  qrImage: { width: 220, height: 220 },
  infoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eee", marginBottom: 20 },
  infoTitle: { fontWeight: "700", color: "#333", marginBottom: 8, fontSize: 14 },
  infoText: { fontSize: 13, color: "#555", lineHeight: 22 },
  highlightText: { fontWeight: "600", color: "#333" },
  codeText: { color: "#d32f2f", fontWeight: "700" },
  description: { fontSize: 13, color: "#777", lineHeight: 20, marginBottom: 24, textAlign: "center" },
  backButton: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#2E7D32",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
