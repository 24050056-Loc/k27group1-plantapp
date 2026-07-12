import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Bell, Search, SlidersHorizontal, Plus } from "lucide-react-native";
import { getHomeData } from "../api/home";
import { Product, Category } from "../../types";
import { resolveProductImage } from "../../assets/productImages";

const BANNERS = [
  {
    id: 1,
    title: "Spring Collection",
    subtitle: "Fresh arrivals just landed",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&fit=crop",
    badge: "New Season",
    badgeColor: "#F4A261",
  }
];

type Props = {
  onSelectProduct: (product: Product) => void;
};

export default function HomeScreen({ onSelectProduct }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getHomeData();
        if (res.success) {
          setProducts(res.featuredProducts);
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Dùng helper để hổ trợ ảnh local (assets/products) hoặc remote
  const getProductImageSource = (urlPath: string | null | undefined) => {
    return resolveProductImage(urlPath);
  };

  // Map icon danh mục tùy theo tên
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("giống") || lower.includes("mầm")) return "🌱";
    if (lower.includes("cảnh") || lower.includes("trong nhà")) return "🌿";
    if (lower.includes("ngoài trời")) return "🌳";
    if (lower.includes("hoa")) return "🌸";
    return "🍃";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>Plantify 🌿</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={20} stroke="#1A2E1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} stroke="#666" style={styles.searchIcon} />
        <TextInput placeholder="Search plants, pots, seeds..." placeholderTextColor="#888" style={styles.searchInput} />
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={16} stroke="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.bannerCard}>
        <Image source={{ uri: BANNERS[0].img }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={[styles.badge, { backgroundColor: BANNERS[0].badgeColor }]}>{BANNERS[0].badge}</Text>
          <Text style={styles.bannerHeading}>{BANNERS[0].title}</Text>
          <Text style={styles.bannerSub}>{BANNERS[0].subtitle}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      
      {/* CUỘN NGANG DANH MỤC */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoriesRow}
      >
        {categories.map((item) => (
          <TouchableOpacity key={item.id} style={styles.categoryCard}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(item.ten_danh_muc)}</Text>
            <Text style={styles.categoryText} numberOfLines={1}>{item.ten_danh_muc}</Text>
          </TouchableOpacity>
        ))}
        {categories.length === 0 && !loading && (
          <Text style={styles.emptyText}>Không tìm thấy danh mục</Text>
        )}
      </ScrollView>

      <Text style={styles.sectionTitle}>Best Sellers</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.productsRow}>
          {products.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.productCard}
              onPress={() => onSelectProduct(product)}
            >
              <Image source={getProductImageSource(product.hinh_anh_url)} style={styles.productImage} />
              <Text style={styles.productName} numberOfLines={1}>{product.ten_san_pham}</Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>{parseFloat(product.gia_tien).toLocaleString('vi-VN')}đ</Text>
                <View style={styles.addButton}>
                  <Plus size={14} stroke="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {products.length === 0 && (
            <Text style={styles.emptyText}>Không có sản phẩm nào bán chạy</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  greeting: { color: "#888", fontSize: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1A2E1A", marginTop: 4 },
  iconButton: { width: 44, height: 44, backgroundColor: "#f5f5f5", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 16, paddingHorizontal: 12, height: 48, marginBottom: 18 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  filterButton: { width: 36, height: 36, backgroundColor: "#2E7D32", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bannerCard: { marginBottom: 20, borderRadius: 22, overflow: "hidden", height: 180 },
  bannerImage: { width: "100%", height: "100%" },
  bannerOverlay: { position: "absolute", inset: 0, padding: 18, backgroundColor: "rgba(0,0,0,0.28)", justifyContent: "flex-end" },
  badge: { alignSelf: "flex-start", color: "#fff", fontSize: 10, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  bannerHeading: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  bannerSub: { color: "rgba(255,255,255,0.88)", fontSize: 12, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A2E1A", marginBottom: 14, marginTop: 10 },
  categoriesRow: { flexDirection: "row", gap: 12, paddingBottom: 10 },
  categoryCard: { width: 90, alignItems: "center", backgroundColor: "#fff", borderRadius: 18, paddingVertical: 14, borderWidth: 1, borderColor: "#eee" },
  categoryIcon: { fontSize: 24 },
  categoryText: { marginTop: 8, fontSize: 12, color: "#666", paddingHorizontal: 4 },
  productsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: { width: "48%", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "#eee", marginBottom: 16 },
  productImage: { width: "100%", height: 112, borderRadius: 16, backgroundColor: "#f9f9f9" },
  productName: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#333" },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  productPrice: { fontSize: 14, fontWeight: "bold", color: "#2E7D32" },
  addButton: { width: 28, height: 28, borderRadius: 10, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#888", width: "100%", textAlign: "center", marginVertical: 10 },
});

