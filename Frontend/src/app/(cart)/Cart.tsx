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
} from "../../services/cartService";
import { CartItem } from "../../types";
import { baseUrl } from "../../api";
import { resolveProductImage, resolveProductImageByName } from "../../assets/productImages";

import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  Leaf,
  Check,
} from "lucide-react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = -80; // bao nhiêu px vuốt sang trái để lộ nút xóa

// ---- SwipeableCartItem component ----
type SwipeableItemProps = {
  item: CartItem;
  onDelete: (productId: number) => void;
  onChangeQuantity: (cartId: number, delta: number, currentQty: number) => void;
  isUpdating: boolean;
  isSelected: boolean;
  onToggleSelect: (cartId: number) => void;
};

function SwipeableCartItem({
  item,
  onDelete,
  onChangeQuantity,
  isUpdating,
  isSelected,
  onToggleSelect,
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
    }).start(() => onDelete(item.product_id));
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

        {/* Checkbox để chọn sản phẩm */}
        <TouchableOpacity
          style={[swipeStyles.checkbox, isSelected && swipeStyles.checkboxSelected]}
          onPress={() => onToggleSelect(item.cart_id)}
        >
          {isSelected && <Check size={14} stroke="#fff" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Ảnh sản phẩm */}
        <View style={swipeStyles.imageContainer}>
          <Image
            source={
              item.hinh_anh_url && item.hinh_anh_url.startsWith("http")
                ? { uri: item.hinh_anh_url }
                : item.hinh_anh_url
                ? resolveProductImage(item.hinh_anh_url)
                : resolveProductImageByName(item.ten_san_pham)
            }
            style={swipeStyles.productImage}
          />
        </View>

        {/* Thông tin sản phẩm */}
        <View style={swipeStyles.infoContainer}>
          {item.is_combo && (
            <View style={swipeStyles.comboBadge}>
              <Text style={swipeStyles.comboBadgeText}>
                {item.dac_tinh?.emoji || "🎁"} COMBO
                {item.discount_percent ? ` -${item.discount_percent}%` : ""}
              </Text>
            </View>
          )}
          <Text style={swipeStyles.productName} numberOfLines={2}>
            {item.ten_san_pham}
          </Text>

          {item.combo_items && Array.isArray(item.combo_items) && item.combo_items.length > 0 ? (
            <Text style={swipeStyles.comboItemsText} numberOfLines={2}>
              {item.combo_items.join(" • ")}
            </Text>
          ) : item.mo_ta && item.is_combo ? (
            <Text style={swipeStyles.comboItemsText} numberOfLines={2}>
              {item.mo_ta}
            </Text>
          ) : null}

          <View style={swipeStyles.priceWrap}>
            {item.original_price && item.original_price > price ? (
              <Text style={swipeStyles.originalPriceText}>
                {Number(item.original_price).toLocaleString("vi-VN")}đ
              </Text>
            ) : null}
            <Text style={swipeStyles.unitPrice}>
              {price.toLocaleString("vi-VN")}đ {item.is_combo ? "/ combo" : "/ cái"}
            </Text>
          </View>
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

// ---- Main Cart Screen ----
type Props = {
  onBack: () => void;
  onCheckout: () => void;
};

const SHIPPING_FEE = 30000;

export default function CartScreen({ onBack, onCheckout }: Props) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async (productId: number) => {
    setDeletingId(productId);
    try {
      await removeFromCart(token ?? undefined, productId);
      setCartItems((prev) => prev.filter((i) => i.product_id !== productId));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        const removedItem = cartItems.find((item) => item.product_id === productId);
        if (removedItem) newSet.delete(removedItem.cart_id);
        return newSet;
      });
    } catch (err) {
      console.error("Lỗi xóa sản phẩm khỏi giỏ:", err);
      Alert.alert("Lỗi xóa sản phẩm", err instanceof Error ? err.message : "Vui lòng thử lại.");
      loadCart();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSelect = (cartId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cartId)) {
        newSet.delete(cartId);
      } else {
        newSet.add(cartId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === cartItems.length) {
      // Nếu tất cả đã chọn, bỏ chọn tất cả
      setSelectedIds(new Set());
    } else {
      // Chọn tất cả
      setSelectedIds(new Set(cartItems.map((item) => item.cart_id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn sản phẩm để xóa.");
      return;
    }

    Alert.alert(
      "Xác nhận xóa",
      `Bạn muốn xóa ${selectedIds.size} sản phẩm?`,
      [
        { text: "Hủy", onPress: () => {} },
        {
          text: "Xóa",
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Xóa từng sản phẩm
              await Promise.all(
                Array.from(selectedIds).map((cartId) => {
                  const item = cartItems.find((cartItem) => cartItem.cart_id === cartId);
                  return item
                    ? removeFromCart(token ?? undefined, item.product_id)
                    : Promise.resolve();
                }
                )
              );
              // Cập nhật danh sách
              setCartItems((prev) =>
                prev.filter((i) => !selectedIds.has(i.cart_id))
              );
              setSelectedIds(new Set());
              Alert.alert("Thành công", "Đã xóa các sản phẩm đã chọn.");
            } catch (err) {
              console.error("Lỗi xóa sản phẩm đã chọn:", err);
              Alert.alert("Lỗi xóa sản phẩm", err instanceof Error ? err.message : "Vui lòng thử lại.");
              loadCart();
            } finally {
              setIsDeleting(false);
            }
          },
          style: "destructive",
        },
      ]
    );
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
        {cartItems.length > 0 && selectedIds.size === 0 ? (
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
          >
            <Text style={styles.selectAllText}>Chọn tất cả</Text>
          </TouchableOpacity>
        ) : selectedIds.size > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedIds.size}</Text>
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
                  isSelected={selectedIds.has(item.cart_id)}
                  onToggleSelect={handleToggleSelect}
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
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  <Text style={styles.summaryValue}>
                    {SHIPPING_FEE.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Tổng cộng</Text>
                  <Text style={styles.summaryValueBold}>
                    {(subtotal + SHIPPING_FEE).toLocaleString("vi-VN")}đ
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

              {/* Action buttons khi có sản phẩm được chọn */}
              {selectedIds.size > 0 && (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelSelectButton}
                    onPress={() => setSelectedIds(new Set())}
                  >
                    <Text style={styles.cancelSelectButtonText}>Bỏ chọn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteSelectedButton, isDeleting && styles.deleteButtonDisabled]}
                    onPress={handleDeleteSelected}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Trash2 size={16} stroke="#fff" />
                        <Text style={styles.deleteSelectedButtonText}>
                          Xóa ({selectedIds.size})
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
  selectAllButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EDF3E8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 12,
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
  // Action buttons cho multi-select
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelSelectButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#f9fafb",
  },
  cancelSelectButtonText: {
    color: "#6B7F6B",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteSelectedButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    gap: 6,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteSelectedButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
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
  comboBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  comboBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2E7D32",
  },
  comboItemsText: {
    fontSize: 11,
    color: "#4E6B4E",
    marginBottom: 4,
    fontStyle: "italic",
    lineHeight: 15,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  originalPriceText: {
    fontSize: 11,
    color: "#999",
    textDecorationLine: "line-through",
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
