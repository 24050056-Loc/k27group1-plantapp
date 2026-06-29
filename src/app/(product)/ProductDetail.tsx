import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

type Props = { onBack: () => void; };

export default function ProductDetailScreen({ onBack }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>&larr; Quay lại</Text>
      </TouchableOpacity>
      <Image source={{ uri: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&fit=crop" }} style={styles.image} />
      <Text style={styles.title}>Monstera Deliciosa</Text>
      <Text style={styles.price}>$34.99</Text>
      <Text style={styles.description}>Cây Monstera tươi xanh, thích hợp trang trí phòng khách và góc làm việc.</Text>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionText}>Thêm vào giỏ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40, backgroundColor: "#fff" },
  backButton: { marginBottom: 20 },
  backText: { color: "#2E7D32", fontSize: 14, fontWeight: "700" },
  image: { width: "100%", height: 260, borderRadius: 24, backgroundColor: "#f0f0f0", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#1A2E1A", marginBottom: 8 },
  price: { fontSize: 22, fontWeight: "700", color: "#2E7D32", marginBottom: 16 },
  description: { fontSize: 16, color: "#666", lineHeight: 24, marginBottom: 24 },
  actionButton: { backgroundColor: "#2E7D32", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});
