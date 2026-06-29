import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { User, Settings, CreditCard, HelpCircle, LogOut } from "lucide-react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop" }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>Nguyễn An</Text>
          <Text style={styles.role}>Plant Lover</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.row}><User size={18} stroke="#2E7D32" /><Text style={styles.rowText}>Hồ sơ của tôi</Text></View>
        <View style={styles.row}><CreditCard size={18} stroke="#2E7D32" /><Text style={styles.rowText}>Phương thức thanh toán</Text></View>
        <View style={styles.row}><Settings size={18} stroke="#2E7D32" /><Text style={styles.rowText}>Cài đặt</Text></View>
        <View style={styles.row}><HelpCircle size={18} stroke="#2E7D32" /><Text style={styles.rowText}>Trợ giúp</Text></View>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <LogOut size={16} stroke="#fff" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#f0f0f0" },
  name: { fontSize: 20, fontWeight: "700", color: "#1A2E1A" },
  role: { fontSize: 13, color: "#666", marginTop: 4 },
  profileCard: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#eee", padding: 16, gap: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  rowText: { fontSize: 14, color: "#333", fontWeight: "600" },
  logoutButton: { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#e53935", paddingVertical: 14, borderRadius: 16 },
  logoutText: { color: "#fff", fontWeight: "700" }
});
