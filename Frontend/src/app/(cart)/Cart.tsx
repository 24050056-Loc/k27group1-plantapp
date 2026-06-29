import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getCart } from "../../services/cartService";
import { CartItem } from "../../types";

type Props = { 
  onBack: () => void; 
  onCheckout: () => void; 
};

export default function CartScreen({ onBack, onCheckout }: Props) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCart() {
      if (!token) return;
      try {
        const items = await getCart(token);
        setCartItems(items);
      } catch (err) {
        console.error("Lỗi khi lấy giỏ hàng:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [token]);

  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.gia_tien) * item.so_luong, 0);

  const handleCheckoutPress = () => {
    if (cartItems.length === 0) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán.");
      return;
    }
    onCheckout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giỏ hàng</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
      ) : (
        <>
          <Text style={styles.subtitle}>{cartItems.length} sản phẩm trong giỏ của bạn</Text>
          
          <FlatList
            data={cartItems}
            scrollEnabled={false} // Cuộn theo ScrollView ngoài
            keyExtractor={(item) => item.cart_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.ten_san_pham}</Text>
                  <Text style={styles.itemQty}>x{item.so_luong}</Text>
                </View>
                <Text style={styles.itemDetails}>
                  Đơn giá: {parseFloat(item.gia_tien).toLocaleString('vi-VN')}đ
                </Text>
                <Text style={styles.itemTotal}>
                  Thành tiền: {(parseFloat(item.gia_tien) * item.so_luong).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
            }
          />

          {cartItems.length > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Tổng tiền hàng:</Text>
              <Text style={styles.totalValue}>{subtotal.toLocaleString('vi-VN')}đ</Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
              <Text style={styles.secondaryButtonText}>Quay lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleCheckoutPress}>
              <Text style={styles.primaryButtonText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#1A2E1A", marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 20 },
  itemCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#eee" },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 16, fontWeight: "700", color: "#333" },
  itemQty: { fontSize: 14, fontWeight: "700", color: "#666" },
  itemDetails: { marginTop: 6, color: "#666", fontSize: 13 },
  itemTotal: { marginTop: 8, color: "#2E7D32", fontWeight: "700", fontSize: 14 },
  totalContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 20, paddingHorizontal: 4 },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#555" },
  totalValue: { fontSize: 20, fontWeight: "700", color: "#2E7D32" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  primaryButton: { backgroundColor: "#2E7D32", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, flex: 1, marginLeft: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, borderColor: "#2E7D32", alignItems: "center" },
  secondaryButtonText: { color: "#2E7D32", fontWeight: "700" },
  emptyText: { color: "#888", textAlign: "center", marginVertical: 30 }
});

