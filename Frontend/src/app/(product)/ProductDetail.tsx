import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Share
} from "react-native";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Droplets,
  Sun,
  Thermometer,
  Package,
  Tag,
  CheckCircle2,
  Leaf
} from "lucide-react-native";
import { Product } from "../../types";
import { resolveProductImage } from "../../assets/productImages";
import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../services/cartService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  product: Product | null;
  onBack: () => void;
};

// ─── Derive care info from product description/name ──────────────────────────
function getCareInfo(product: Product) {
  const name = (product.ten_san_pham || "").toLowerCase();
  const desc = (product.mo_ta || "").toLowerCase();

  const isSucculent =
    name.includes("xương rồng") || name.includes("sen đá") || desc.includes("khô hạn");
  const isTropical =
    name.includes("monstera") || name.includes("phát tài") || name.includes("nhiệt đới");
  const isHerb =
    name.includes("rau") || name.includes("húng") || name.includes("basil") || desc.includes("ăn được");

  if (isSucculent) {
    return { water: "2 tuần/lần", light: "Nắng trực tiếp", temp: "15–35°C", difficulty: "Dễ" };
  }
  if (isHerb) {
    return { water: "Hàng ngày", light: "Ánh sáng vừa", temp: "20–30°C", difficulty: "Trung bình" };
  }
  if (isTropical) {
    return { water: "2–3 lần/tuần", light: "Ánh sáng gián tiếp", temp: "18–28°C", difficulty: "Trung bình" };
  }
  return { water: "1–2 lần/tuần", light: "Ánh sáng gián tiếp", temp: "18–30°C", difficulty: "Dễ" };
}

// ─── Quantity Selector ────────────────────────────────────────────────────────
function QuantitySelector({
  qty,
  max,
  onChange
}: {
  qty: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.qtyRow}>
      <TouchableOpacity
        style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
        onPress={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
      >
        <Text style={styles.qtyBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.qtyValue}>{qty}</Text>
      <TouchableOpacity
        style={[styles.qtyBtn, qty >= max && styles.qtyBtnDisabled]}
        onPress={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
      >
        <Text style={styles.qtyBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProductDetailScreen({ product, onBack }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "care" | "info">("desc");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const wishlistScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true })
    ]).start();
  }, []);

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Leaf size={48} color="#A5D6A7" />
        <Text style={styles.errorText}>Không tìm thấy thông tin sản phẩm!</Text>
        <TouchableOpacity onPress={onBack} style={styles.errorBackBtn}>
          <Text style={styles.errorBackText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const careInfo = getCareInfo(product);
  const price = parseFloat(product.gia_tien);
  const inStock = product.so_luong_kho > 0;

  const handleAddToCart = async () => {
    if (!token) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }
    setLoading(true);
    try {
      const result = await addToCart(token, product.id, qty);
      if (result.success) {
        Alert.alert("🎉 Thành công!", `Đã thêm ${qty} "${product.ten_san_pham}" vào giỏ hàng!`);
      } else {
        Alert.alert("Thất bại", result.message || "Không thể thêm sản phẩm.");
      }
    } catch {
      Alert.alert("Lỗi", "Lỗi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = () => {
    setIsWishlisted((p) => !p);
    Animated.sequence([
      Animated.spring(wishlistScale, { toValue: 1.4, tension: 200, friction: 4, useNativeDriver: true }),
      Animated.spring(wishlistScale, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true })
    ]).start();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌿 ${product.ten_san_pham} - Chỉ ${price.toLocaleString("vi-VN")}đ trên PlantApp! Xem ngay nhé.`
      });
    } catch {}
  };

  return (
    <View style={styles.screen}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={onBack}>
          <ArrowLeft size={22} color="#1A2E1A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {product.ten_san_pham}
        </Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarBtn} onPress={handleShare}>
            <Share2 size={20} color="#1A2E1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarBtn} onPress={handleWishlist}>
            <Animated.View style={{ transform: [{ scale: wishlistScale }] }}>
              <Heart
                size={20}
                color={isWishlisted ? "#E53935" : "#1A2E1A"}
                fill={isWishlisted ? "#E53935" : "transparent"}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Product Image ── */}
        <View style={styles.imageWrapper}>
          <Image
            source={resolveProductImage(product.hinh_anh_url)}
            style={styles.image}
            resizeMode="cover"
          />
          {!inStock && (
            <View style={styles.outOfStockBanner}>
              <Text style={styles.outOfStockText}>Hết hàng</Text>
            </View>
          )}
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Leaf size={11} color="#2E7D32" />
            <Text style={styles.categoryBadgeText}>Cây xanh</Text>
          </View>
        </View>

        <View style={styles.contentPad}>
          {/* ── Name & Price ── */}
          <Text style={styles.productName}>{product.ten_san_pham}</Text>
          {product.ten_khoa_hoc ? (
            <Text style={styles.scientificName}>🔬 {product.ten_khoa_hoc}</Text>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{price.toLocaleString("vi-VN")}đ</Text>
            {inStock ? (
              <View style={styles.stockBadge}>
                <CheckCircle2 size={13} color="#2E7D32" />
                <Text style={styles.stockBadgeText}>Còn {product.so_luong_kho} sản phẩm</Text>
              </View>
            ) : (
              <View style={[styles.stockBadge, styles.stockBadgeOut]}>
                <Text style={[styles.stockBadgeText, { color: "#F44336" }]}>Hết hàng</Text>
              </View>
            )}
          </View>

          {/* ── Tag chips ── */}
          <View style={styles.tagRow}>
            {["Cây trong nhà", "Dễ chăm", "Lọc không khí"].map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Tag size={10} color="#2E7D32" />
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* ── Tab Switcher ── */}
          <View style={styles.tabBar}>
            {(["desc", "care", "info"] as const).map((tab) => {
              const labels = { desc: "Mô tả", care: "Chăm sóc", info: "Thông tin" };
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Tab Content ── */}
          {activeTab === "desc" && (
            <View style={styles.tabContent}>
              <Text style={styles.descText}>
                {product.mo_ta ||
                  "Sản phẩm tươi xanh, thích hợp trang trí nhà cửa và văn phòng. Mang lại không gian trong lành, tràn đầy sức sống và giúp lọc không khí hiệu quả. Phù hợp với người mới bắt đầu chơi cây."}
              </Text>
            </View>
          )}

          {activeTab === "care" && (
            <View style={styles.tabContent}>
              <View style={styles.careGrid}>
                <View style={styles.careCard}>
                  <Droplets size={22} color="#1565C0" />
                  <Text style={styles.careLabel}>Tưới nước</Text>
                  <Text style={styles.careValue}>{careInfo.water}</Text>
                </View>
                <View style={styles.careCard}>
                  <Sun size={22} color="#F57F17" />
                  <Text style={styles.careLabel}>Ánh sáng</Text>
                  <Text style={styles.careValue}>{careInfo.light}</Text>
                </View>
                <View style={styles.careCard}>
                  <Thermometer size={22} color="#C62828" />
                  <Text style={styles.careLabel}>Nhiệt độ</Text>
                  <Text style={styles.careValue}>{careInfo.temp}</Text>
                </View>
                <View style={styles.careCard}>
                  <Leaf size={22} color="#2E7D32" />
                  <Text style={styles.careLabel}>Độ khó</Text>
                  <Text style={styles.careValue}>{careInfo.difficulty}</Text>
                </View>
              </View>
              <View style={styles.careTip}>
                <Text style={styles.careTipTitle}>💡 Mẹo chăm sóc</Text>
                <Text style={styles.careTipText}>
                  Kiểm tra độ ẩm đất trước khi tưới. Tưới từ từ cho đến khi nước chảy ra lỗ thoát. Tránh để cây trong vũng nước đọng.
                </Text>
              </View>
            </View>
          )}

          {activeTab === "info" && (
            <View style={styles.tabContent}>
              <View style={styles.infoTable}>
                {[
                  { icon: <Package size={15} color="#666" />, label: "Tình trạng kho", value: inStock ? `Còn ${product.so_luong_kho} sp` : "Hết hàng" },
                  { icon: <Tag size={15} color="#666" />, label: "Mã sản phẩm", value: `SP-${String(product.id).padStart(4, "0")}` },
                  { icon: <Leaf size={15} color="#666" />, label: "Xuất xứ", value: "Việt Nam" },
                  { icon: <CheckCircle2 size={15} color="#666" />, label: "Bảo hành", value: "7 ngày đổi trả" },
                ].map((row, idx) => (
                  <View key={idx} style={[styles.infoRow, idx % 2 === 0 && styles.infoRowEven]}>
                    <View style={styles.infoLabelRow}>
                      {row.icon}
                      <Text style={styles.infoLabel}>{row.label}</Text>
                    </View>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── Fixed Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomPriceLabel}>Tổng tiền</Text>
          <Text style={styles.bottomPrice}>
            {(price * qty).toLocaleString("vi-VN")}đ
          </Text>
        </View>

        <QuantitySelector qty={qty} max={product.so_luong_kho} onChange={setQty} />

        <TouchableOpacity
          style={[styles.addToCartBtn, (!inStock || loading) && styles.addToCartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!inStock || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <View style={styles.addToCartBtnInner}>
              <ShoppingCart size={16} color="#FFF" />
              <Text style={styles.addToCartText}>
                {inStock ? "Thêm vào giỏ" : "Hết hàng"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAFBFA"
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    padding: 24
  },
  errorText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center"
  },
  errorBackBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20
  },
  errorBackText: {
    color: "#FFF",
    fontWeight: "700"
  },
  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 8
  },
  topBarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  topBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E1A",
    textAlign: "center"
  },
  topBarRight: {
    flexDirection: "row",
    gap: 6
  },
  // Image
  imageWrapper: {
    width: "100%",
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: "#F0F4F0",
    position: "relative"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  outOfStockBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center"
  },
  outOfStockText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800"
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32"
  },
  // Content
  contentPad: {
    padding: 20
  },
  productName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A2E1A",
    lineHeight: 30,
    marginBottom: 4
  },
  scientificName: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 12
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  price: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2E7D32"
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  stockBadgeOut: {
    backgroundColor: "#FFEBEE"
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32"
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 20
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8F1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#C8E6C9"
  },
  tagChipText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600"
  },
  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F0F4F0",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center"
  },
  tabBtnActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888"
  },
  tabBtnTextActive: {
    color: "#2E7D32",
    fontWeight: "800"
  },
  tabContent: {
    minHeight: 100
  },
  // Description
  descText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24
  },
  // Care
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  careCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#EEF2EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  careLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600"
  },
  careValue: {
    fontSize: 13,
    color: "#1A2E1A",
    fontWeight: "800",
    textAlign: "center"
  },
  careTip: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE082"
  },
  careTipTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F57F17",
    marginBottom: 6
  },
  careTipText: {
    fontSize: 13,
    color: "#795548",
    lineHeight: 19
  },
  // Info table
  infoTable: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2EE"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF"
  },
  infoRowEven: {
    backgroundColor: "#FAFBFA"
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  infoLabel: {
    fontSize: 13,
    color: "#666"
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E1A"
  },
  // Quantity
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center"
  },
  qtyBtnDisabled: {
    backgroundColor: "#F5F5F5"
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
    lineHeight: 20
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2E1A",
    minWidth: 24,
    textAlign: "center"
  },
  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    gap: 12
  },
  bottomLeft: {
    flex: 1
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: "#AAA",
    fontWeight: "600"
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2E7D32"
  },
  addToCartBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 130
  },
  addToCartBtnDisabled: {
    backgroundColor: "#C8E6C9"
  },
  addToCartBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  addToCartText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13
  }
});
