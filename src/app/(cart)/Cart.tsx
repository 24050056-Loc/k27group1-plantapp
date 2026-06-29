import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = { onBack: () => void; onCheckout: () => void; };

export default function CartScreen({ onBack, onCheckout }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giỏ hàng</Text>
      <Text style={styles.subtitle}>2 sản phẩm trong giỏ của bạn</Text>
      <View style={styles.itemCard}>
        <Text style={styles.itemName}>Monstera Deliciosa</Text>
        <Text style={styles.itemDetails}>Medium, 1x</Text>
      </View>
      <View style={styles.itemCard}>
        <Text style={styles.itemName}>Snake Plant</Text>
        <Text style={styles.itemDetails}>Small, 1x</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={onCheckout}>
          <Text style={styles.primaryButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#1A2E1A", marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 20 },
  itemCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#eee" },
  itemName: { fontSize: 16, fontWeight: "700", color: "#333" },
  itemDetails: { marginTop: 6, color: "#666" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  primaryButton: { backgroundColor: "#2E7D32", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, borderColor: "#2E7D32" },
  secondaryButtonText: { color: "#2E7D32", fontWeight: "700" }
});
