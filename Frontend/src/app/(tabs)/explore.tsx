import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Compass, Sparkles, MapPin } from "lucide-react-native";

const TOPICS = [
  { id: 1, title: "Trending Plants" },
  { id: 2, title: "New Arrivals" },
  { id: 3, title: "Shop by Style" }
];

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Compass size={28} stroke="#2E7D32" />
        <Text style={styles.title}>Khám Phá</Text>
      </View>
      <Text style={styles.subtitle}>Duyệt những ý tưởng và bộ sưu tập mới nhất.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Collections</Text>
        <Text style={styles.cardText}>Gợi ý cây trồng theo phong cách, không gian và sở thích.</Text>
      </View>

      <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
      {TOPICS.map((topic) => (
        <TouchableOpacity key={topic.id} style={styles.topicButton}>
          <Text style={styles.topicText}>{topic.title}</Text>
          <Sparkles size={16} stroke="#2E7D32" />
        </TouchableOpacity>
      ))}

      <View style={styles.footerCard}>
        <MapPin size={20} stroke="#2E7D32" />
        <Text style={styles.footerText}>Khám phá cửa hàng gần bạn</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A2E1A" },
  subtitle: { color: "#666", fontSize: 14, marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#eee", marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  cardText: { color: "#666", fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A2E1A", marginBottom: 14 },
  topicButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 16, padding: 14, marginBottom: 12 },
  topicText: { fontSize: 14, fontWeight: "600", color: "#333" },
  footerCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#e8f5e9", borderRadius: 18, padding: 16, marginTop: 24 },
  footerText: { color: "#2E7D32", fontSize: 14, fontWeight: "600" }
});
