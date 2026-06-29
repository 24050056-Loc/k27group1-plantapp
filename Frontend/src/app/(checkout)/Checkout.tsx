import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { placeOrder } from "../../services/checkoutService";

type Props = { 
  onBack: () => void; 
  onCheckoutSuccess: (orderId: number) => void;
  onChooseCOD: () => void; 
  onChooseQR: () => void; 
};

export default function CheckoutScreen({ onBack, onCheckoutSuccess, onChooseCOD, onChooseQR }: Props) {
  const { token, user } = useAuth();
  const [address, setAddress] = useState(user?.dia_chi || "");
  const [loading, setLoading] = useState(false);

  const handleChoosePayment = async (type: "COD" | "QR") => {
    if (!address.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ giao hàng trước khi thanh toán.");
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      // Gọi API đặt hàng lên backend
      const result = await placeOrder(token, address.trim());
      
      if (result.success && result.order_id) {
        // Lưu ID đơn hàng và di chuyển sang màn hình thanh toán tương ứng
        onCheckoutSuccess(result.order_id);
        if (type === "COD") {
          onChooseCOD();
        } else {
          onChooseQR();
        }
      } else {
        Alert.alert("Lỗi đặt hàng", result.message || "Đặt hàng không thành công.");
      }
    } catch (error) {
      Alert.alert("Lỗi kết nối", "Không thể gửi yêu cầu đặt hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thanh toán</Text>
      
      <Text style={styles.sectionLabel}>Địa chỉ giao hàng *</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Nhập địa chỉ nhận cây cảnh..."
        placeholderTextColor="#888"
        multiline
        style={styles.addressInput}
        disabled={loading}
      />

      <Text style={styles.subtitle}>Chọn phương thức thanh toán</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleChoosePayment("COD")}>
            <Text style={styles.optionText}>Thanh toán khi nhận hàng (COD)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleChoosePayment("QR")}>
            <Text style={styles.optionText}>Thanh toán chuyển khoản (Quét QR)</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading}>
        <Text style={styles.backText}>Quay lại giỏ hàng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#1A2E1A", marginBottom: 18 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 8 },
  addressInput: { 
    backgroundColor: "#f5f5f5", 
    borderRadius: 14, 
    padding: 14, 
    fontSize: 15, 
    color: "#333", 
    borderWidth: 1, 
    borderColor: "#eee", 
    height: 80, 
    textAlignVertical: "top",
    marginBottom: 24 
  },
  subtitle: { fontSize: 16, fontWeight: "700", color: "#1A2E1A", marginBottom: 16 },
  optionButton: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eee", padding: 18, marginBottom: 16 },
  optionText: { color: "#333", fontSize: 16, fontWeight: "600" },
  backButton: { marginTop: 16, alignItems: "center" },
  backText: { color: "#2E7D32", fontWeight: "700" }
});

