import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  addToCart,
} from "../../services/cartService";
import { CartItem } from "../../types";
import { STARTER_KITS, StarterKit } from "../../data/starterKits";

import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  Sparkles,
  Leaf,
} from "lucide-react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = -80; // bao nhiêu px vuốt sang trái để lộ nút xóa

// ---- SwipeableCartItem component ----
type SwipeableItemProps = {
  item: CartItem;
  onDelete: (cartId: number) => void;
  onChangeQuantity: (cartId: number, delta: number, currentQty: number) => void;
  isUpdating: boolean;
};

function SwipeableCartItem({
  item,
  onDelete,
  onChangeQuantity,
  isUpdating,
}: SwipeableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Chỉ bắt gesture ngang (horizontal) rõ ràng hơn dọc
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Chỉ cho vuốt sang trái (dx < 0), giới hạn tối đa -100
        const clampedX = Math.max(-100, Math.min(0, gestureState.dx));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Mở nút xóa
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
          setSwiped(true);
        } else {
          // Đóng lại
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
          setSwiped(false);
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setSwiped(false);
  };

  const handleDelete = () => {
    // Animate out then call delete
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete(item.cart_id));
  };

  const price = parseFloat(item.gia_tien);

  return (
    <View style={swipeStyles.wrapper}>
      {/* Nút xóa phía sau */}
      <View style={swipeStyles.deleteBackground}>
        <TouchableOpacity style={swipeStyles.deleteButton} onPress={handleDelete}>
          <Trash2 size={22} stroke="#fff" />
          <Text style={swipeStyles.deleteText}>Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* Card chính có thể vuốt */}
      <Animated.View
        style={[swipeStyles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Khi đang open thì thêm lớp đóng khi chạm vào phần card */}
        {swiped && (
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={closeSwipe}
            activeOpacity={1}
          />
        )}

        {/* Ảnh sản phẩm */}
        <View style={swipeStyles.imageContainer}>
          {item.hinh_anh_url ? (
            <Image
              source={{ uri: item.hinh_anh_url.startsWith("http") ? item.hinh_anh_url : `http://192.168.190.13:8080/${item.hinh_anh_url}` }}
              style={swipeStyles.productImage}
            />
          ) : (
            <View style={swipeStyles.imagePlaceholder}>
              <Leaf size={28} stroke="#2E7D32" />
            </View>
          )}
        </View>

        {/* Thông tin sản phẩm */}
        <View style={swipeStyles.infoContainer}>
          <Text style={swipeStyles.productName} numberOfLines={2}>
            {item.ten_san_pham}
          </Text>
          <Text style={swipeStyles.unitPrice}>
            {price.toLocaleString("vi-VN")}đ / cái
          </Text>
          <Text style={swipeStyles.lineTotal}>
            = {(price * item.so_luong).toLocaleString("vi-VN")}đ
          </Text>
        </View>

        {/* Stepper số lượng */}
        <View style={swipeStyles.quantityContainer}>
          <TouchableOpacity
            style={[
              swipeStyles.stepperBtn,
              item.so_luong <= 1 && swipeStyles.stepperBtnDisabled,
            ]}
            onPress={() => onChangeQuantity(item.cart_id, -1, item.so_luong)}
            disabled={isUpdating || item.so_luong <= 1}
          >
            <Minus size={14} stroke={item.so_luong <= 1 ? "#ccc" : "#2E7D32"} />
          </TouchableOpacity>

          {isUpdating ? (
            <ActivityIndicator size="small" color="#2E7D32" style={{ width: 32 }} />
          ) : (
            <Text style={swipeStyles.qtyText}>{item.so_luong}</Text>
          )}

          <TouchableOpacity
            style={swipeStyles.stepperBtn}
            onPress={() => onChangeQuantity(item.cart_id, 1, item.so_luong)}
            disabled={isUpdating}
          >
            <Plus size={14} stroke="#2E7D32" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ---- StarterKit Card ----
type StarterKitCardProps = {
  kit: StarterKit;
  onAdd: (kit: StarterKit) => void;
  isAdding: boolean;
};

function StarterKitCard({ kit, onAdd, isAdding }: StarterKitCardProps) {
  return (
    <View style={kitStyles.card}>
      {/* Tag badge */}
      <View style={[kitStyles.tag, { backgroundColor: kit.tagColor }]}>
        <Text style={kitStyles.tagText}>{kit.tag}</Text>
      </View>

      {/* Discount badge */}
      <View style={kitStyles.discountBadge}>
        <Text style={kitStyles.discountText}>-{kit.discount}%</Text>
      </View>

      {/* Emoji icon */}
      <Text style={kitStyles.emoji}>{kit.emoji}</Text>

      <Text style={kitStyles.kitName}>{kit.name}</Text>
      <Text style={kitStyles.kitDescription}>{kit.description}</Text>

      {/* Item list */}
      <View style={kitStyles.itemList}>
        {kit.items.map((it, idx) => (
          <Text key={idx} style={kitStyles.kitItem}>
            {it}
          </Text>
        ))}
      </View>

      {/* Pricing */}
      <View style={kitStyles.priceRow}>
        <View>
          <Text style={kitStyles.originalPrice}>
            {kit.originalPrice.toLocaleString("vi-VN")}đ
          </Text>
          <Text style={kitStyles.salePrice}>
            {kit.salePrice.toLocaleString("vi-VN")}đ
          </Text>
        </View>
        <TouchableOpacity
          style={kitStyles.addButton}
          onPress={() => onAdd(kit)}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Plus size={14} stroke="#fff" />
              <Text style={kitStyles.addButtonText}>Thêm vào giỏ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Main Cart Screen ----
type Props = {
  onBack: () => void;
  onCheckout: () => void;
};

export default function CartScreen({ onBack, onCheckout }: Props) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [addingKitId, setAddingKitId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const items = await getCart(token);
      setCartItems(items);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setCartItems([]);
      } else {
        console.error("Lỗi khi lấy giỏ hàng:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleDelete = async (cartId: number) => {
    setDeletingId(cartId);
    try {
      await removeFromCart(token ?? undefined, cartId);
      setCartItems((prev) => prev.filter((i) => i.cart_id !== cartId));
    } catch (err) {
      Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
      // Refresh để lấy lại đúng data
      loadCart();
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangeQuantity = async (
    cartId: number,
    delta: number,
    currentQty: number
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    // Optimistic update
    setCartItems((prev) =>
      prev.map((i) =>
        i.cart_id === cartId ? { ...i, so_luong: newQty } : i
      )
    );
    setUpdatingId(cartId);

    try {
      await updateCartItemQuantity(token ?? undefined, cartId, newQty);
    } catch (err) {
      // Rollback on error
      setCartItems((prev) =>
        prev.map((i) =>
          i.cart_id === cartId ? { ...i, so_luong: currentQty } : i
        )
      );
      Alert.alert("Lỗi", "Không thể cập nhật số lượng. Vui lòng thử lại.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddStarterKit = async (kit: StarterKit) => {
    if (!token) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Bạn cần đăng nhập để thêm vào giỏ hàng."
      );
      return;
    }
    setAddingKitId(kit.id);
    // Giả lập thêm combo — trong thực tế sẽ gọi API riêng cho combo
    await new Promise((r) => setTimeout(r, 900));
    setAddingKitId(null);
    Alert.alert(
      "🎉 Đã thêm Combo!",
      `"${kit.name}" đã được thêm vào giỏ hàng của bạn.`
    );
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.gia_tien) * item.so_luong,
    0
  );
  const itemCount = cartItems.reduce((s, i) => s + i.so_luong, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Giỏ hàng trống",
        "Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán."
      );
      return;
    }
    onCheckout();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={22} stroke="#1A2E1A" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <ShoppingCart size={20} stroke="#2E7D32" />
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
        </View>
        {itemCount > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{itemCount}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Danh sách sản phẩm ---- */}
          {cartItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🛍️ Sản phẩm ({cartItems.length})
              </Text>
              <Text style={styles.swipeHint}>
                ← Vuốt sang trái để xóa sản phẩm
              </Text>

              {cartItems.map((item) => (
                <SwipeableCartItem
                  key={item.cart_id}
                  item={item}
                  onDelete={handleDelete}
                  onChangeQuantity={handleChangeQuantity}
                  isUpdating={updatingId === item.cart_id}
                />
              ))}

              {/* Tổng tiền */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tạm tính ({itemCount} sản phẩm)</Text>
                  <Text style={styles.summaryValue}>
                    {subtotal.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Tổng cộng</Text>
                  <Text style={styles.summaryValueBold}>
                    {subtotal.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </View>

              {/* Nút Thanh toán */}
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutButtonText}>
                  Tiến hành thanh toán →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ShoppingCart size={48} stroke="#81C784" />
              </View>
              <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
              <Text style={styles.emptySubtitle}>
                Hãy khám phá các sản phẩm cây cảnh tươi đẹp!
              </Text>
              <TouchableOpacity style={styles.goShopButton} onPress={onBack}>
                <Text style={styles.goShopText}>Khám phá cửa hàng →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ---- Starter Kit Upsell Section ---- */}
          <View style={styles.section}>
            <View style={styles.starterKitHeader}>
              <View style={styles.starterKitTitleRow}>
                <Sparkles size={18} stroke="#F4A261" />
                <Text style={styles.starterKitTitle}>
                  Gói Combo Starter Kit
                </Text>
              </View>
              <Text style={styles.starterKitSubtitle}>
                Tiết kiệm hơn khi mua combo – Cây giống + Đất trồng + Chậu cảnh
              </Text>
            </View>

            {STARTER_KITS.map((kit) => (
              <StarterKitCard
                key={kit.id}
                kit={kit}
                onAdd={handleAddStarterKit}
                isAdding={addingKitId === kit.id}
              />
            ))}
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF5",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 48 : 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(46,125,50,0.1)",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EDF3E8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E1A",
    marginLeft: 6,
  },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7F6B",
    fontSize: 14,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 12,
    color: "#6B7F6B",
    marginBottom: 12,
    fontStyle: "italic",
  },
  // Summary card
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7F6B",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(46,125,50,0.1)",
    marginVertical: 12,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  summaryValueBold: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
  },
  // Checkout button
  checkoutButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  checkoutButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EDF3E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7F6B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  goShopButton: {
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  goShopText: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 14,
  },
  // Starter Kit section header
  starterKitHeader: {
    backgroundColor: "linear-gradient(135deg, #EDF3E8, #fff)",
    marginBottom: 16,
  },
  starterKitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  starterKitTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A2E1A",
    marginLeft: 8,
  },
  starterKitSubtitle: {
    fontSize: 13,
    color: "#6B7F6B",
    lineHeight: 18,
  },
});

// Swipeable item styles
const swipeStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: "#D32F2F",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EDF3E8",
    flexShrink: 0,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E1A",
    lineHeight: 20,
    marginBottom: 4,
  },
  unitPrice: {
    fontSize: 12,
    color: "#6B7F6B",
    marginBottom: 2,
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    borderColor: "#ccc",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E1A",
    minWidth: 28,
    textAlign: "center",
  },
});

// Starter Kit card styles
const kitStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.12)",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
  },
  tag: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  discountBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: "#E65100",
    fontWeight: "700",
    fontSize: 12,
  },
  emoji: {
    fontSize: 40,
    marginTop: 32,
    marginBottom: 10,
  },
  kitName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 4,
  },
  kitDescription: {
    fontSize: 13,
    color: "#6B7F6B",
    lineHeight: 18,
    marginBottom: 12,
  },
  itemList: {
    backgroundColor: "#F8FAF5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  kitItem: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
    paddingVertical: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  originalPrice: {
    fontSize: 13,
    color: "#aaa",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  salePrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },
});
