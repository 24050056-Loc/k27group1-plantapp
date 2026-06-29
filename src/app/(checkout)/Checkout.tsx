import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = { onBack: () => void; onChooseCOD: () => void; onChooseQR: () => void; };

export default function CheckoutScreen({ onBack, onChooseCOD, onChooseQR }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thanh toán</Text>
      <Text style={styles.subtitle}>Chọn phương thức thanh toán</Text>
      <TouchableOpacity style={styles.optionButton} onPress={onChooseCOD}>
        <Text style={styles.optionText}>Thanh toán khi nhận hàng (COD)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={onChooseQR}>
        <Text style={styles.optionText}>Quét mã QR</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Quay lại giỏ hàng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#1A2E1A", marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 24 },
  optionButton: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eee", padding: 18, marginBottom: 16 },
  optionText: { color: "#333", fontSize: 16, fontWeight: "600" },
  backButton: { marginTop: 24, alignItems: "center" },
  backText: { color: "#2E7D32", fontWeight: "700" }
});
