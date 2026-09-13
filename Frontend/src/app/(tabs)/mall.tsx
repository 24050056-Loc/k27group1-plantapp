import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Animated, Keyboard } from "react-native";
import { Search, Plus, ShoppingCart, RotateCcw, X } from "lucide-react-native";
import { getProducts, searchProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { addToCart, getCart } from "../../services/cartService";
import { Product, Category } from "../../types";
import { resolveProductImage } from "../../assets/productImages";
import { useAuth } from "../../context/AuthContext";

type Props = {
  onSelectProduct: (product: Product) => void;
  onOpenCart?: () => void;
  initialCategoryId?: number | null;
  onClearInitialCategory?: () => void;
};

export default function MallScreen({
  onSelectProduct,
  onOpenCart,
  initialCategoryId,
  onClearInitialCategory,
}: Props) {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortType, setSortType] = useState<"default" | "priceAsc" | "priceDesc">("default");
  const [priceFilter, setPriceFilter] = useState<"all" | "under100" | "100to300" | "over300">("all");
  const [cartCount, setCartCount] = useState<number>(0);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  // Nhận diện chuyển tab từ Home khi bấm chọn Danh mục cụ thể
  useEffect(() => {
    if (initialCategoryId !== undefined && initialCategoryId !== null) {
      setSelectedCategory(initialCategoryId);
      if (onClearInitialCategory) {
        onClearInitialCategory();
      }
    }
  }, [initialCategoryId]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodList, catList] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(prodList);
        setCategories(catList);

        // fetch cart count if logged in
        if (token) {
          try {
            const items = await getCart(token);
            setCartCount(items.reduce((s, it) => s + it.so_luong, 0));
          } catch (err: any) {
            if (err.response?.status === 403 || err.response?.status === 401) {
              setCartCount(0);
            } else {
              console.error("Lỗi khi lấy giỏ hàng (badge):", err);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tại Mall:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  // Bộ lọc sản phẩm đa năng (Search, Category, Price Range, Sort)
  useEffect(() => {
    let result = [...products];

    // 1. Lọc theo từ khóa tìm kiếm
    if (search.trim()) {
      result = result.filter((p) =>
        p.ten_san_pham.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 2. Lọc theo danh mục
    if (selectedCategory !== null) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // 3. Lọc theo khoảng giá
    if (priceFilter === "under100") {
      result = result.filter((p) => parseFloat(p.gia_tien) < 100000);
    } else if (priceFilter === "100to300") {
      result = result.filter((p) => {
        const val = parseFloat(p.gia_tien);
        return val >= 100000 && val <= 300000;
      });
    } else if (priceFilter === "over300") {
      result = result.filter((p) => parseFloat(p.gia_tien) > 300000);
    }

    // 4. Sắp xếp theo giá tiền
    if (sortType === "priceAsc") {
      result.sort((a, b) => parseFloat(a.gia_tien) - parseFloat(b.gia_tien));
    } else if (sortType === "priceDesc") {
      result.sort((a, b) => parseFloat(b.gia_tien) - parseFloat(a.gia_tien));
    }

    setFilteredProducts(result);
  }, [products, search, selectedCategory, sortType, priceFilter]);

  const handleSearch = (text: string) => {
    setSearch(text);
    // Also trigger suggestion search
    handleSuggestionSearch(text);
  };

  // ─ Search suggestions (realtime dropdown) ───────────────────────────
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const showDropdown = searchFocused && search.length > 0;

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 160,
      useNativeDriver: true
    }).start();
  }, [showDropdown]);

  const handleSuggestionSearch = (text: string) => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (!text.trim()) { setSuggestions([]); setSuggesting(false); return; }
    setSuggesting(true);
    suggestDebounce.current = setTimeout(async () => {
      try {
        const res = await searchProducts(text);
        setSuggestions(res);
      } catch { setSuggestions([]); }
      finally { setSuggesting(false); }
    }, 350);
  };

  const handleSelectSuggestion = (product: Product) => {
    Keyboard.dismiss();
    setSearchFocused(false);
    setSearch("");
    setSuggestions([]);
    onSelectProduct(product);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSuggestions([]);
    setSearchFocused(false);
    Keyboard.dismiss();
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
        // Update badge count locally
        setCartCount((c) => c + 1);
      } else {
        Alert.alert("Thất bại", result.message || "Không thể thêm sản phẩm.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setActionLoading(null);
    }
  };

  const getProductImageSource = (urlPath: string | null | undefined) => {
    return resolveProductImage(urlPath);
  };

  const handleReload = async () => {
    try {
      setLoading(true);
      const [prodList, catList] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(prodList);
      setCategories(catList);
    } catch (err) {
      console.error("Lỗi tải lại mall:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Cửa hàng 🌿</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.cartButton} onPress={handleReload}>
            <RotateCcw size={18} stroke="#1A2E1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton} onPress={() => onOpenCart && onOpenCart()}>
            <ShoppingCart size={20} stroke="#1A2E1A" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar with dropdown */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchRow, searchFocused && styles.searchRowFocused]}>
          <Search size={18} stroke={searchFocused ? "#2E7D32" : "#888"} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            placeholder="Tìm sản phẩm cây cảnh, cây giống..."
            placeholderTextColor="#AAA"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {suggesting && <ActivityIndicator size="small" color="#2E7D32" style={{ marginRight: 8 }} />}
          {search.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <X size={16} stroke="#AAA" />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestion dropdown */}
        {showDropdown && (
          <Animated.View style={[
            styles.dropdown,
            {
              opacity: dropdownAnim,
              transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }]
            }
          ]}>
            {suggestions.length === 0 && !suggesting ? (
              <View style={styles.dropdownEmpty}>
                <Text style={styles.dropdownEmptyText}>Không tìm thấy "{search}"</Text>
              </View>
            ) : (
              <ScrollView
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 280 }}
                showsVerticalScrollIndicator={true}
              >
                {suggestions.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={resolveProductImage(item.hinh_anh_url)}
                        style={styles.suggestionImg}
                      />
                      <View style={styles.suggestionInfo}>
                        <Text style={styles.suggestionName} numberOfLines={1}>{item.ten_san_pham}</Text>
                        <Text style={styles.suggestionPrice}>
                          {parseFloat(item.gia_tien).toLocaleString("vi-VN")}đ
                        </Text>
                      </View>
                      <Text style={styles.suggestionArrow}>›</Text>
                    </TouchableOpacity>
                    {index < suggestions.length - 1 && (
                      <View style={{ height: 1, backgroundColor: "#F5F5F5", marginHorizontal: 14 }} />
                    )}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}
      </View>

      {/* Danh mục dạng cuộn ngang */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === null && styles.categoryTextActive,
              ]}
            >
              🌿 Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.ten_danh_muc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bộ lọc nhanh (Sắp xếp, Khoảng giá) */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {/* Sắp xếp */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              sortType !== "default" && styles.filterPillActive,
            ]}
            onPress={() => {
              if (sortType === "default") setSortType("priceAsc");
              else if (sortType === "priceAsc") setSortType("priceDesc");
              else setSortType("default");
            }}
          >
            <Text
              style={[
                styles.filterText,
                sortType !== "default" && styles.filterTextActive,
              ]}
            >
              {sortType === "default" && "⇅ Giá"}
              {sortType === "priceAsc" && "📈 Giá tăng"}
              {sortType === "priceDesc" && "📉 Giá giảm"}
            </Text>
          </TouchableOpacity>

          {/* Dưới 100k */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              priceFilter === "under100" && styles.filterPillActive,
            ]}
            onPress={() => setPriceFilter(priceFilter === "under100" ? "all" : "under100")}
          >
            <Text
              style={[
                styles.filterText,
                priceFilter === "under100" && styles.filterTextActive,
              ]}
            >
              Dưới 100k
            </Text>
          </TouchableOpacity>

          {/* 100k - 300k */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              priceFilter === "100to300" && styles.filterPillActive,
            ]}
            onPress={() => setPriceFilter(priceFilter === "100to300" ? "all" : "100to300")}
          >
            <Text
              style={[
                styles.filterText,
                priceFilter === "100to300" && styles.filterTextActive,
              ]}
            >
              100k - 300k
            </Text>
          </TouchableOpacity>

          {/* Trên 300k */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              priceFilter === "over300" && styles.filterPillActive,
            ]}
            onPress={() => setPriceFilter(priceFilter === "over300" ? "all" : "over300")}
          >
            <Text
              style={[
                styles.filterText,
                priceFilter === "over300" && styles.filterTextActive,
              ]}
            >
              Trên 300k
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.productCard}
              onPress={() => onSelectProduct(item)}
            >
              <Image source={getProductImageSource(item.hinh_anh_url)} style={styles.productImage} resizeMode="cover" />
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
          ))}
          {filteredProducts.length === 0 && (
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2E1A", marginBottom: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 16, paddingHorizontal: 12, height: 48, marginBottom: 16, borderWidth: 1.5, borderColor: "#E8F5E9" },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cartButton: { width: 44, height: 44, backgroundColor: "#f5f5f5", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  rowWrapper: { justifyContent: "space-between" },
  cartBadge: { position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#d32f2f", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  cartBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  productCard: { width: "48%", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "#eee", marginBottom: 16 },
  productImage: { width: "100%", height: 112, borderRadius: 16, backgroundColor: "#f9f9f9" },
  productName: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#333" },
  scientificName: { fontSize: 11, fontStyle: "italic", color: "#888", marginTop: 2 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  productPrice: { fontSize: 13, fontWeight: "bold", color: "#2E7D32" },
  addButton: { width: 28, height: 28, borderRadius: 10, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  emptyText: { color: "#888", textAlign: "center", width: "100%", marginTop: 20 },

  // Styles mới cho filters
  categoriesContainer: { marginBottom: 10 },
  categoriesScroll: { gap: 8, paddingRight: 10 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  categoryPillActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#2E7D32",
    fontWeight: "700",
  },

  filtersContainer: { marginBottom: 16 },
  filtersScroll: { gap: 6, paddingRight: 10 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterPillActive: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FFB74D",
  },
  filterText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#E65100",
    fontWeight: "700",
  },
  searchWrapper: {
    position: "relative",
    zIndex: 999,
    marginBottom: 16,
  },
  searchRowFocused: {
    backgroundColor: "#F1F8F1",
    borderColor: "#2E7D32",
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  dropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
    overflow: "hidden",
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: "center",
  },
  dropdownEmptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestionImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2E1A",
    marginBottom: 2,
  },
  suggestionPrice: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "700",
  },
  suggestionArrow: {
    paddingLeft: 8,
    fontSize: 22,
    color: "#CCC",
    lineHeight: 24,
  },
});

