import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from "react-native";
import { ShoppingBag, Plus, Minus, Trash2, Check } from "lucide-react-native";

const INIT_CART = [
  { id: 1, name: "Monstera Deliciosa", variant: "Medium – 10\"", price: 34.99, qty: 1, img: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&fit=crop" },
  { id: 2, name: "Snake Plant", variant: "Small – 6\"", price: 24.99, qty: 1, img: "https://images.unsplash.com/photo-1495326967771-1726a4c67011?w=200&fit=crop" }
];

export default function MallScreen() {
  const [cart, setCart] = useState(INIT_CART);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);

  const changeQty = (id: number, delta: number) => {
    setCart((prev) => prev
      .map((item) => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item)
      .filter((item) => item.qty > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = applied ? subtotal * 0.15 : 0;
  const shipping = subtotal > 60 || subtotal === 0 ? 0 : 6.99;
  const total = subtotal - discount + shipping;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mall</Text>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={64} stroke="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          {cart.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.img }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => changeQty(item.id, -item.qty)}>
                    <Trash2 size={16} stroke="#e53935" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemVariant}>{item.variant}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity onPress={() => changeQty(item.id, -1)} style={styles.qtyBtn}>
                      <Minus size={12} stroke="#333" />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => changeQty(item.id, 1)} style={styles.qtyBtn}>
                      <Plus size={12} stroke="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Coupon Code</Text>
            <View style={styles.couponRow}>
              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                placeholder="Enter LEAF15"
                placeholderTextColor="#888"
                style={styles.couponInput}
              />
              <TouchableOpacity
                onPress={() => { if (coupon.toUpperCase() === "LEAF15") setApplied(true); }}
                style={[styles.applyButton, applied && { backgroundColor: "#e8f5e9" }]}
              >
                {applied ? <Check size={16} color="#2e7d32" /> : <Text style={styles.applyText}>Apply</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Order Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryText}>Subtotal</Text><Text style={styles.summaryText}>${subtotal.toFixed(2)}</Text></View>
            {applied && <View style={styles.summaryRow}><Text style={styles.summaryText}>Discount (15%)</Text><Text style={[styles.summaryText, styles.discountText]}>-${discount.toFixed(2)}</Text></View>}
            <View style={styles.summaryRow}><Text style={styles.summaryText}>Shipping</Text><Text style={styles.summaryText}>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.totalText}>Total</Text><Text style={styles.totalText}>${total.toFixed(2)}</Text></View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2E1A", marginBottom: 20 },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 16, color: "#666", fontSize: 14 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#eee", padding: 14, marginBottom: 14 },
  itemImage: { width: 78, height: 78, borderRadius: 16, backgroundColor: "#f9f9f9" },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 14, fontWeight: "700", color: "#333", maxWidth: "80%" },
  itemVariant: { color: "#888", fontSize: 12, marginTop: 4 },
  itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: "#2E7D32" },
  qtyBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 10, paddingHorizontal: 8 },
  qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  qtyValue: { fontSize: 12, fontWeight: "700", marginHorizontal: 8 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#eee", padding: 16, marginTop: 16 },
  summaryLabel: { fontSize: 14, fontWeight: "700", color: "#333" },
  couponRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  couponInput: { flex: 1, height: 44, borderRadius: 12, backgroundColor: "#f5f5f5", paddingHorizontal: 14, fontSize: 14, color: "#333" },
  applyButton: { marginLeft: 10, paddingHorizontal: 18, height: 44, borderRadius: 12, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center" },
  applyText: { color: "#fff", fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  summaryText: { color: "#333", fontSize: 14 },
  discountText: { color: "#2E7D32" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 14 },
  totalText: { fontSize: 16, fontWeight: "700", color: "#1A2E1A" }
});
