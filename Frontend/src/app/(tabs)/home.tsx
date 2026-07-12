import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Bell, Search, SlidersHorizontal, Plus } from "lucide-react-native";
import { getFeaturedProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { Product, Category } from "../../types";
import { resolveProductImage } from "../../assets/productImages";
import { STARTER_KITS, StarterKit } from "../../data/starterKits";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40; // full width trừ padding
const CARD_HEIGHT = 200;

type Props = {
  onSelectProduct: (product: Product) => void;
};

// ─── Starter Kit Poster Carousel ────────────────────────────────────────────
function StarterKitCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll mỗi 3.5 giây
  useEffect(() => {
    autoScrollTimer.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % STARTER_KITS.length;
        scrollRef.current?.scrollTo({
          x: next * CARD_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 3500);

    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, []);

  // Reset timer khi user tự cuộn
  const resetAutoScroll = () => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % STARTER_KITS.length;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 3500);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActiveIndex(index);
  };

  const handleAddToCart = (kit: StarterKit) => {
    Alert.alert(
      "🎉 Đã thêm Combo!",
      `"${kit.name}" đã được thêm vào giỏ hàng.`
    );
  };

  return (
    <View style={carouselStyles.wrapper}>
      {/* Section header */}
      <View style={carouselStyles.sectionHeader}>
        <View style={carouselStyles.sectionTitleRow}>
          <Sparkles size={16} stroke="#F4A261" />
          <Text style={carouselStyles.sectionTitle}>Combo Starter Kit</Text>
        </View>
        <Text style={carouselStyles.sectionSub}>
          Tiết kiệm hơn khi mua trọn bộ 🌿
        </Text>
      </View>

      {/* Horizontal poster scroll */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={resetAutoScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={carouselStyles.scrollContent}
      >
        {STARTER_KITS.map((kit, index) => (
          <View key={kit.id} style={carouselStyles.posterCard}>
            {/* Background image */}
            <Image
              source={{ uri: kit.bgImage }}
              style={carouselStyles.posterBg}
              resizeMode="cover"
            />

            {/* Dark overlay gradient (via semi-transparent Views) */}
            <View style={carouselStyles.overlayDark} />
            <View
              style={[
                carouselStyles.overlayColor,
                { backgroundColor: kit.gradientFrom + "CC" },
              ]}
            />

            {/* Content */}
            <View style={carouselStyles.posterContent}>
              {/* Top row: tag + discount */}
              <View style={carouselStyles.topRow}>
                <View style={[carouselStyles.tagBadge, { backgroundColor: kit.tagColor }]}>
                  <Text style={carouselStyles.tagText}>{kit.tag}</Text>
                </View>
                <View style={carouselStyles.discountBadge}>
                  <Text style={carouselStyles.discountText}>-{kit.discount}%</Text>
                </View>
              </View>

              {/* Middle: emoji + title */}
              <Text style={carouselStyles.emoji}>{kit.emoji}</Text>
              <Text style={carouselStyles.kitName}>{kit.name}</Text>
              <Text style={carouselStyles.kitDesc} numberOfLines={2}>
                {kit.description}
              </Text>

              {/* Bottom row: price + CTA */}
              <View style={carouselStyles.bottomRow}>
                <View>
                  <Text style={carouselStyles.originalPrice}>
                    {kit.originalPrice.toLocaleString("vi-VN")}đ
                  </Text>
                  <Text style={carouselStyles.salePrice}>
                    {kit.salePrice.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={carouselStyles.ctaButton}
                  onPress={() => handleAddToCart(kit)}
                >
                  <Plus size={13} stroke="#2E7D32" />
                  <Text style={carouselStyles.ctaText}>Thêm vào giỏ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={carouselStyles.dotsRow}>
        {STARTER_KITS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              scrollRef.current?.scrollTo({ x: i * CARD_WIDTH, animated: true });
              setActiveIndex(i);
              resetAutoScroll();
            }}
          >
            <View
              style={[
                carouselStyles.dot,
                i === activeIndex && carouselStyles.dotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen({ onSelectProduct }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, catList] = await Promise.all([
          getFeaturedProducts(),
          getCategories()
        ]);
        setProducts(prodList);
        setCategories(catList);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getProductImageSource = (urlPath: string | null | undefined) =>
    resolveProductImage(urlPath);

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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>Plantify 🌿</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={20} stroke="#1A2E1A" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={18} stroke="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="Search plants, pots, seeds..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={16} stroke="#fff" />
        </TouchableOpacity>
      </View>

      {/* ★ Starter Kit Carousel */}
      <StarterKitCarousel />

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {categories.map((item) => (
          <TouchableOpacity key={item.id} style={styles.categoryCard}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(item.ten_danh_muc)}</Text>
            <Text style={styles.categoryText} numberOfLines={1}>
              {item.ten_danh_muc}
            </Text>
          </TouchableOpacity>
        ))}
        {categories.length === 0 && !loading && (
          <Text style={styles.emptyText}>Không tìm thấy danh mục</Text>
        )}
      </ScrollView>

      {/* Best Sellers */}
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
              <Image
                source={getProductImageSource(product.hinh_anh_url)}
                style={styles.productImage}
              />
              <Text style={styles.productName} numberOfLines={1}>
                {product.ten_san_pham}
              </Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>
                  {parseFloat(product.gia_tien).toLocaleString("vi-VN")}đ
                </Text>
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

// ─── Carousel Styles ──────────────────────────────────────────────────────────
const carouselStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginLeft: 6,
  },
  sectionSub: {
    fontSize: 12,
    color: "#6B7F6B",
    marginLeft: 2,
  },
  scrollContent: {
    gap: 0,
  },
  posterCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 0,
    position: "relative",
  },
  posterBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayColor: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  posterContent: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  discountBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  emoji: {
    fontSize: 28,
    marginTop: -4,
    marginBottom: 2,
  },
  kitName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  kitDesc: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  originalPrice: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  salePrice: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 3,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C8D8C8",
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2E7D32",
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  greeting: { color: "#888", fontSize: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1A2E1A", marginTop: 4 },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  filterButton: {
    width: 36,
    height: 36,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 14,
    marginTop: 18,
  },
  categoriesRow: { flexDirection: "row", gap: 12, paddingBottom: 10 },
  categoryCard: {
    width: 90,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  categoryIcon: { fontSize: 24 },
  categoryText: { marginTop: 8, fontSize: 12, color: "#666", paddingHorizontal: 4 },
  productsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 16,
  },
  productImage: {
    width: "100%",
    height: 112,
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
  },
  productName: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#333" },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  productPrice: { fontSize: 14, fontWeight: "bold", color: "#2E7D32" },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: "#888", width: "100%", textAlign: "center", marginVertical: 10 },
});
