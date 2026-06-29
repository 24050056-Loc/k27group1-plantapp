import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Product } from "../../types";
import { baseUrl } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../services/cartService";

type Props = {
  product: Product | null;
  onBack: () => void;
};

export default function ProductDetailScreen({ product, onBack }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin sản phẩm!</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>&larr; Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getProductImageUrl = (urlPath: string | null | undefined) => {
    if (!urlPath) return "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&fit=crop";
    if (urlPath.startsWith("http")) return urlPath;
    return `${baseUrl}/${urlPath}`;
  };

  const handleAddToCart = async () => {
    if (!token) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    setLoading(true);
    try {
      const result = await addToCart(token, product.id, 1);
      if (result.success) {
        Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng!");
      } else {
        Alert.alert("Thất bại", result.message || "Không thể thêm sản phẩm.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>&larr; Quay lại</Text>
      </TouchableOpacity>
      <Image source={{ uri: getProductImageUrl(product.hinh_anh_url) }} style={styles.image} />
      <Text style={styles.title}>{product.ten_san_pham}</Text>
      {product.ten_khoa_hoc ? <Text style={styles.scientificName}>{product.ten_khoa_hoc}</Text> : null}
      <Text style={styles.price}>{parseFloat(product.gia_tien).toLocaleString('vi-VN')}đ</Text>
      
      <Text style={styles.sectionLabel}>Mô tả chi tiết</Text>
      <Text style={styles.description}>
        {product.mo_ta || "Sản phẩm tươi xanh, thích hợp trang trí nhà cửa, mang lại không gian trong lành và tràn đầy sức sống."}
      </Text>
      
      <View style={styles.stockRow}>
        <Text style={styles.stockLabel}>Tình trạng kho: </Text>
        <Text style={styles.stockValue}>{product.so_luong_kho > 0 ? `Còn hàng (${product.so_luong_kho})` : "Hết hàng"}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, product.so_luong_kho <= 0 && styles.disabledButton]} 
        onPress={handleAddToCart}
        disabled={loading || product.so_luong_kho <= 0}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionText}>{product.so_luong_kho > 0 ? "Thêm vào giỏ" : "Hết hàng"}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40, backgroundColor: "#fff" },
  centerContainer: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#666", marginBottom: 20 },
  backButton: { marginBottom: 20, alignSelf: "flex-start" },
  backText: { color: "#2E7D32", fontSize: 14, fontWeight: "700" },
  image: { width: "100%", height: 260, borderRadius: 24, backgroundColor: "#f0f0f0", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#1A2E1A", marginBottom: 4 },
  scientificName: { fontSize: 14, fontStyle: "italic", color: "#666", marginBottom: 12 },
  price: { fontSize: 22, fontWeight: "700", color: "#2E7D32", marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 8 },
  description: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 20 },
  stockRow: { flexDirection: "row", marginBottom: 28 },
  stockLabel: { fontSize: 14, color: "#666" },
  stockValue: { fontSize: 14, fontWeight: "700", color: "#2E7D32" },
  actionButton: { backgroundColor: "#2E7D32", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});

