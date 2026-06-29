import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, Clock, Megaphone } from "lucide-react-native";

const EVENTS = [
  { id: 1, title: "Weekend Workshop", time: "Sat 10:00 AM", location: "Plant Studio" },
  { id: 2, title: "Grow Tips Live", time: "Wed 7:00 PM", location: "Online" }
];

export default function EventScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={28} stroke="#2E7D32" />
        <Text style={styles.title}>Sự kiện</Text>
      </View>
      <Text style={styles.subtitle}>Các sự kiện và buổi hội thảo sắp tới dành cho bạn.</Text>

      {EVENTS.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventRow}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Megaphone size={18} stroke="#2E7D32" />
          </View>
          <View style={styles.eventMeta}>
            <Clock size={14} stroke="#666" />
            <Text style={styles.eventText}>{event.time}</Text>
          </View>
          <View style={styles.eventMeta}>
            <Calendar size={14} stroke="#666" />
            <Text style={styles.eventText}>{event.location}</Text>
          </View>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A2E1A" },
  subtitle: { color: "#666", fontSize: 14, marginBottom: 20 },
  eventCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#eee", marginBottom: 16 },
  eventRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  eventTitle: { fontSize: 16, fontWeight: "700", color: "#1A2E1A", maxWidth: "75%" },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  eventText: { color: "#666", fontSize: 13 },
  ctaButton: { marginTop: 8, backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 10, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "700" }
});
