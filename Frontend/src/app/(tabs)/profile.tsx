import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { User as UserIcon, Settings, CreditCard, HelpCircle, LogOut, ShoppingBag } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { getUserOrders } from "../../services/userService";
import { Order } from "../../types";

type Props = {
  onLogout: () => void;
};

export default function ProfileScreen({ onLogout }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoadingOrders(true);
      getUserOrders(user.id)
        .then((data) => setOrders(data))
        .catch((err) => console.error("Lỗi lấy lịch sử đơn hàng:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  // Trả về màu tương ứng với trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status) {
      case "cho_duyet":
        return "#f57c00"; // Cam
      case "dang_xu_ly":
      case "dang_giao":
        return "#0288d1"; // Xanh dương
      case "da_giao":
      case "da_thu/da_xu_ly":
      case "da_thu/da_xac_nhan":
        return "#2e7d32"; // Xanh lá
      case "da_huy":
        return "#d32f2f"; // Đỏ
      default:
        return "#666";
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "cho_duyet": return "Chờ duyệt";
      case "dang_xu_ly": return "Đang xử lý";
      case "dang_giao": return "Đang giao";
      case "da_giao": return "Đã giao";
      case "da_huy": return "Đã hủy";
      case "da_thu/da_xu_ly": return "Đã thu/Đang xử lý";
      case "da_thu/da_xac_nhan": return "Đã thanh toán";
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop" }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.name}>{user?.ho_ten || user?.ten_dang_nhap || "Khách Hàng"}</Text>
          <Text style={styles.role}>{user?.email || "Chưa cập nhật email"}</Text>
          <Text style={styles.badgeRole}>{user?.vai_tro === "admin" ? "Quản trị viên" : "Thành viên"}</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.row}>
          <UserIcon size={18} stroke="#2E7D32" />
          <Text style={styles.rowText}>Tên đăng nhập: {user?.ten_dang_nhap}</Text>
        </View>
        <View style={styles.row}>
          <CreditCard size={18} stroke="#2E7D32" />
          <Text style={styles.rowText}>SĐT: {user?.so_dien_thoai || "Chưa cập nhật"}</Text>
        </View>
        <View style={styles.row}>
          <Settings size={18} stroke="#2E7D32" />
          <Text style={styles.rowText}>Địa chỉ: {user?.dia_chi || "Chưa cập nhật"}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Lịch sử mua hàng</Text>
      
      {loadingOrders ? (
        <ActivityIndicator color="#2E7D32" style={{ marginVertical: 10 }} />
      ) : (
        <View style={styles.ordersContainer}>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Đơn hàng #{order.id}</Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order.trang_thai) }]}>
                  {getStatusName(order.trang_thai)}
                </Text>
              </View>
              <Text style={styles.orderDate}>Ngày đặt: {new Date(order.ngay_dat_hang).toLocaleDateString("vi-VN")}</Text>
              <Text style={styles.orderAddress} numberOfLines={1}>Giao tới: {order.dia_chi_giao_hang}</Text>
              {order.tong_thanh_toan && (
                <Text style={styles.orderTotal}>
                  Tổng tiền: {parseFloat(order.tong_thanh_toan).toLocaleString("vi-VN")}đ
                </Text>
              )}
            </View>
          ))}
          {orders.length === 0 && (
            <View style={styles.emptyOrders}>
              <ShoppingBag size={32} stroke="#ccc" />
              <Text style={styles.emptyOrdersText}>Bạn chưa có đơn hàng nào.</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
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
  role: { fontSize: 13, color: "#666", marginTop: 2 },
  badgeRole: { 
    alignSelf: "flex-start", 
    backgroundColor: "#e8f5e9", 
    color: "#2e7d32", 
    fontSize: 11, 
    fontWeight: "700", 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginTop: 6 
  },
  profileCard: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#eee", padding: 16, gap: 14, marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  rowText: { fontSize: 14, color: "#333", fontWeight: "600", flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A2E1A", marginBottom: 14 },
  ordersContainer: { gap: 12 },
  orderCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eee", padding: 14 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  orderId: { fontWeight: "700", color: "#333" },
  orderStatus: { fontSize: 12, fontWeight: "700" },
  orderDate: { fontSize: 12, color: "#888", marginBottom: 4 },
  orderAddress: { fontSize: 13, color: "#666", marginBottom: 4 },
  orderTotal: { fontSize: 14, fontWeight: "700", color: "#2E7D32", textAlign: "right" },
  emptyOrders: { alignItems: "center", gap: 8, paddingVertical: 20 },
  emptyOrdersText: { color: "#888", fontSize: 13 },
  logoutButton: { marginTop: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#e53935", paddingVertical: 14, borderRadius: 16, marginBottom: 40 },
  logoutText: { color: "#fff", fontWeight: "700" }
});

