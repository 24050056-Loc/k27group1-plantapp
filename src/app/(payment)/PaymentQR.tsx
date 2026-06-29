import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = { onBack: () => void; };

export default function PaymentQRScreen({ onBack }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thanh toán QR</Text>
      <Text style={styles.description}>Quét mã QR để hoàn tất thanh toán nhanh chóng.</Text>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: "#1A2E1A" },
  description: { fontSize: 16, color: "#666", marginBottom: 24 },
  backButton: { backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
