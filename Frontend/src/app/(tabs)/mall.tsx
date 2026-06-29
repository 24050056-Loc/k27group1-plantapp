import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from "react-native";
import { Search, Plus } from "lucide-react-native";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { Product } from "../../types";
import { baseUrl } from "../../api";
import { useAuth } from "../../context/AuthContext";

type Props = {
  onSelectProduct: (product: Product) => void;
};

export default function MallScreen({ onSelectProduct }: Props) {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const prodList = await getProducts();
        setProducts(prodList);
        setFilteredProducts(prodList);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm tại Mall:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((p) =>
        p.ten_san_pham.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!token) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    setActionLoading(product.id);
    try {
      const result = await addToCart(token, product.id, 1);
      if (result.success) {
        Alert.alert("Thành công", `Đã thêm "${product.ten_san_pham}" vào giỏ!`);
      } else {
        Alert.alert("Thất bại", result.message || "Không thể thêm sản phẩm.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setActionLoading(null);
    }
  };

  const getProductImageUrl = (urlPath: string | null | undefined) => {
    if (!urlPath) return "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&fit=crop";
    if (urlPath.startsWith("http")) return urlPath;
    return `${baseUrl}/${urlPath}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cửa hàng 🌿</Text>

      <View style={styles.searchRow}>
        <Search size={18} stroke="#666" style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Tìm sản phẩm cây cảnh, cây giống..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={styles.rowWrapper}
          scrollEnabled={false} // Để ScrollView ở App.tsx cuộn chính
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => onSelectProduct(item)}
            >
              <Image source={{ uri: getProductImageUrl(item.hinh_anh_url) }} style={styles.productImage} />
              <Text style={styles.productName} numberOfLines={1}>{item.ten_san_pham}</Text>
              {item.ten_khoa_hoc ? <Text style={styles.scientificName} numberOfLines={1}>{item.ten_khoa_hoc}</Text> : null}
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>{parseFloat(item.gia_tien).toLocaleString('vi-VN')}đ</Text>
                <TouchableOpacity
                  style={[styles.addButton, item.so_luong_kho <= 0 && styles.disabledButton]}
                  onPress={() => handleAddToCart(item)}
                  disabled={actionLoading === item.id || item.so_luong_kho <= 0}
                >
                  {actionLoading === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Plus size={14} stroke="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2E1A", marginBottom: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 16, paddingHorizontal: 12, height: 48, marginBottom: 20 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  rowWrapper: { justifyContent: "space-between" },
  productCard: { width: "48%", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "#eee", marginBottom: 16 },
  productImage: { width: "100%", height: 112, borderRadius: 16, backgroundColor: "#f9f9f9" },
  productName: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#333" },
  scientificName: { fontSize: 11, fontStyle: "italic", color: "#888", marginTop: 2 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  productPrice: { fontSize: 13, fontWeight: "bold", color: "#2E7D32" },
  addButton: { width: 28, height: 28, borderRadius: 10, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  emptyText: { color: "#888", textAlign: "center", width: "100%", marginTop: 20 }
});

