import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import {
  MapPin,
  Ticket,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  QrCode,
  Truck,
  Sparkles,
  Tag,
  X,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useVoucher } from "../../context/VoucherContext";
import { placeOrder, validateCoupon } from "../../services/checkoutService";
import { getCart } from "../../services/cartService";
import { calculateCheckoutTotal, DEFAULT_SHIPPING_FEE } from "../../types";

type Props = {
  onBack: () => void;
  onCheckoutSuccess: (orderId: number, totalAmount: number) => void;
  onChooseCOD: () => void;
  onChooseQR: () => void;
};

const SHIPPING_FEE = 30000;

function formatDetectedAddress(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return "";

  const isPlusCode = (value?: string | null) => Boolean(value && /^[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(value.trim()));
  const parts = [
    !isPlusCode(place.name) ? place.name : null,
    place.street,
    place.district,
    place.subregion,
    place.city,
    place.region,
    place.country,
  ];

  return parts
    .filter((part, index, values): part is string => Boolean(part) && values.indexOf(part) === index)
    .join(", ");
}

export default function CheckoutScreen({
  onBack,
  onCheckoutSuccess,
  onChooseCOD,
  onChooseQR,
}: Props) {
  const { token, user } = useAuth();
  const { collectedVouchers } = useVoucher();

  const [address, setAddress] = useState(user?.dia_chi || "");
  const [addressConfirmed, setAddressConfirmed] = useState(Boolean(user?.dia_chi));
  const [loading, setLoading] = useState(false);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [fetchingCart, setFetchingCart] = useState(true);
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [addressCoordinates, setAddressCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationRegion, setLocationRegion] = useState<Region | null>(null);
  const [isLocationMapVisible, setIsLocationMapVisible] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [userCouponId, setUserCouponId] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponStatusMsg, setCouponStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Tải giỏ hàng để tính tạm tính
  useEffect(() => {
    async function loadCartSubtotal() {
      if (!token) {
        setFetchingCart(false);
        return;
      }
      try {
        const items = await getCart(token);
        const total = items.reduce(
          (sum, item) => sum + parseFloat(item.gia_tien) * item.so_luong,
          0
        );
        setCartSubtotal(total);
      } catch (err) {
        console.error("Lỗi lấy giỏ hàng tại Checkout:", err);
      } finally {
        setFetchingCart(false);
      }
    }
    loadCartSubtotal();
  }, [token]);

  useEffect(() => {
    const nextAddress = user?.dia_chi || "";
    setAddress(nextAddress);
    setAddressConfirmed(Boolean(nextAddress.trim()));
  }, [user?.dia_chi]);

  const useCurrentLocationForAddress = async () => {
    if (locatingAddress) return;
    setLocatingAddress(true);
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        Alert.alert("Chưa bật vị trí", "Vui lòng bật GPS/Vị trí trên điện thoại rồi thử lại.");
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        Alert.alert("Cần quyền vị trí", "Hãy cho phép ứng dụng truy cập vị trí để tự điền địa chỉ.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setAddressCoordinates(coordinates);
      setLocationRegion({
        ...coordinates,
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      });
      setIsLocationMapVisible(true);
    } catch (error) {
      console.error("Lỗi xác định vị trí trên Checkout:", error);
      Alert.alert("Không thể xác định vị trí", "Vui lòng thử lại hoặc nhập địa chỉ thủ công.");
    } finally {
      setLocatingAddress(false);
    }
  };

  const confirmMapLocation = async () => {
    if (!addressCoordinates || isConfirmingLocation) return;

    setIsConfirmingLocation(true);
    try {
      const [place] = await Location.reverseGeocodeAsync(addressCoordinates);
      const detectedAddress = formatDetectedAddress(place);
      if (!detectedAddress) {
        Alert.alert("Không tìm thấy địa chỉ", "Bạn có thể kéo ghim đến vị trí khác hoặc nhập thủ công.");
        return;
      }

      setAddress(detectedAddress);
      setAddressConfirmed(true);
      setIsLocationMapVisible(false);
    } catch (error) {
      Alert.alert("Không thể xác định địa chỉ", "Vui lòng thử lại với vị trí khác.");
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const updateMapCoordinate = (coordinate: { latitude: number; longitude: number }) => {
    setAddressCoordinates(coordinate);
    setLocationRegion((current) => current ? { ...current, ...coordinate } : null);
  };

  // Áp dụng mã giảm giá
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponStatusMsg({ type: "error", text: "Vui lòng nhập mã giảm giá" });
      return;
    }

    setValidatingCoupon(true);
    setCouponStatusMsg(null);

    const res = await validateCoupon(code, cartSubtotal, user?.id);

    if (res.success && res.so_tien_giam_gia !== undefined) {
      setAppliedCoupon(code);
      if (res.data?.user_coupon_id) {
        setUserCouponId(res.data.user_coupon_id);
      }
      setDiscountAmount(res.so_tien_giam_gia);
      setCouponStatusMsg({
        type: "success",
        text: `Áp dụng thành công! Giảm ${res.so_tien_giam_gia.toLocaleString("vi-VN")}đ`,
      });
      setCouponCodeInput(code);
    } else {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponStatusMsg({
        type: "error",
        text: res.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
      });
    }
    setValidatingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setUserCouponId(null);
    setDiscountAmount(0);
    setCouponCodeInput("");
    setCouponStatusMsg(null);
  };

  const finalTotal = calculateCheckoutTotal(cartSubtotal, DEFAULT_SHIPPING_FEE, discountAmount);

  const handleChoosePayment = async (type: "COD" | "QR") => {
    if (!address.trim() || !addressConfirmed) {
      Alert.alert("Xác nhận địa chỉ", "Vui lòng xác nhận địa chỉ giao hàng trước khi thanh toán.");
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const result = await placeOrder(token, address.trim(), userCouponId || undefined);

      if (result.success && result.order_id) {
        // Luôn dùng tổng cuối cùng của checkout để đảm bảo phí vận chuyển được cộng vào
        // Vì một số backend trả về tổng chưa bao gồm shipping.
        const payable = finalTotal;
        onCheckoutSuccess(result.order_id, payable);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading}>
          <ChevronLeft size={22} stroke="#1A2E1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận thanh toán 🌿</Text>
        <View style={{ width: 36 }} />
      </View>

      {fetchingCart ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Đang chuẩn bị thông tin đơn hàng...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Địa chỉ giao hàng */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <MapPin size={18} stroke="#2E7D32" />
              <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
            </View>
            <TextInput
              value={address}
              editable={false}
              placeholder="Hãy cập nhật địa chỉ trong trang Profile hoặc lấy vị trí hiện tại"
              placeholderTextColor="#999"
              multiline
              style={styles.addressInput}
            />

            <TouchableOpacity
              style={[styles.locationButton, locatingAddress && styles.locationButtonDisabled]}
              onPress={useCurrentLocationForAddress}
              disabled={locatingAddress || loading}
            >
              <MapPin size={16} color="#2E7D32" />
              <Text style={styles.locationButtonText}>
                {locatingAddress ? "Đang xác định vị trí..." : "Lấy vị trí hiện tại"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmAddressButton, addressConfirmed && styles.confirmAddressButtonDone]}
              onPress={() => {
                if (!address.trim()) {
                  Alert.alert("Thiếu địa chỉ", "Vui lòng lấy vị trí hoặc nhập địa chỉ trước khi xác nhận.");
                  return;
                }
                setAddressConfirmed(true);
              }}
              disabled={loading}
            >
              <CheckCircle2 size={17} color={addressConfirmed ? "#fff" : "#2E7D32"} />
              <Text style={[styles.confirmAddressText, addressConfirmed && styles.confirmAddressTextDone]}>
                {addressConfirmed ? "Đã xác nhận địa chỉ" : "Xác nhận địa chỉ giao hàng"}
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={isLocationMapVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setIsLocationMapVisible(false)}
          >
            <View style={styles.locationMapScreen}>
              <View style={styles.locationMapHeader}>
                <TouchableOpacity onPress={() => setIsLocationMapVisible(false)}>
                  <X size={20} color="#1A2E1A" />
                </TouchableOpacity>
                <View style={styles.locationMapHeaderText}>
                  <Text style={styles.locationMapTitle}>Xác nhận vị trí</Text>
                  <Text style={styles.locationMapSubtitle}>Chạm hoặc kéo ghim đến đúng vị trí</Text>
                </View>
              </View>

              {locationRegion && addressCoordinates && (
                <MapView
                  style={styles.locationMap}
                  initialRegion={locationRegion}
                  onRegionChangeComplete={(region) => {
                    updateMapCoordinate({ latitude: region.latitude, longitude: region.longitude });
                    setLocationRegion(region);
                  }}
                  showsUserLocation
                  showsMyLocationButton
                >
                  <Marker coordinate={addressCoordinates} />
                </MapView>
              )}

              <View style={styles.locationMapFooter}>
                <Text style={styles.locationMapCoordinate}>
                  {addressCoordinates
                    ? `${addressCoordinates.latitude.toFixed(5)}, ${addressCoordinates.longitude.toFixed(5)}`
                    : "Đang xác định tọa độ"}
                </Text>
                <TouchableOpacity
                  style={[styles.locationConfirmButton, isConfirmingLocation && styles.locationConfirmButtonDisabled]}
                  onPress={confirmMapLocation}
                  disabled={isConfirmingLocation}
                >
                  {isConfirmingLocation ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.locationConfirmText}>Xác nhận vị trí này</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Section 2: Mã giảm giá & Voucher */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ticket size={18} stroke="#E65100" />
              <Text style={styles.cardTitle}>Mã giảm giá & Voucher cây ảo</Text>
            </View>

            {/* Voucher đã tích lũy từ cây ảo */}
            {collectedVouchers.length > 0 && (
              <View style={styles.voucherSection}>
                <Text style={styles.subLabel}>Voucher từ Ví Cây Ảo của bạn:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  {collectedVouchers.map((item, idx) => {
                    const isSelected = appliedCoupon === item.code;
                    return (
                      <TouchableOpacity
                        key={`${item.code || 'voucher'}-${idx}`}
                        style={[styles.voucherPill, isSelected && styles.voucherPillSelected]}
                        onPress={() => {
                          if (isSelected) handleRemoveCoupon();
                          else handleApplyCoupon(item.code);
                        }}
                      >
                        <Tag size={12} stroke={isSelected ? "#fff" : "#2E7D32"} />
                        <Text style={[styles.voucherPillText, isSelected && styles.voucherPillTextSelected]}>
                          {item.code}
                        </Text>
                        {isSelected && <CheckCircle2 size={12} stroke="#fff" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Ô nhập mã giảm giá */}
            <View style={styles.couponInputRow}>
              <TextInput
                value={couponCodeInput}
                onChangeText={(t) => setCouponCodeInput(t.toUpperCase())}
                placeholder="Nhập mã (VD: PLANT10)"
                placeholderTextColor="#999"
                style={styles.couponInput}
                autoCapitalize="characters"
                editable={!loading && !appliedCoupon}
              />
              {appliedCoupon ? (
                <TouchableOpacity style={styles.removeCouponBtn} onPress={handleRemoveCoupon}>
                  <X size={16} stroke="#d32f2f" />
                  <Text style={styles.removeCouponText}>Bỏ</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.applyCouponBtn, validatingCoupon && styles.btnDisabled]}
                  onPress={() => handleApplyCoupon()}
                  disabled={validatingCoupon || !couponCodeInput.trim()}
                >
                  {validatingCoupon ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.applyCouponBtnText}>Áp dụng</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Message kết quả */}
            {couponStatusMsg && (
              <View
                style={[
                  styles.statusBox,
                  couponStatusMsg.type === "success" ? styles.statusSuccess : styles.statusError,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    couponStatusMsg.type === "success" ? styles.statusTextSuccess : styles.statusTextError,
                  ]}
                >
                  {couponStatusMsg.text}
                </Text>
              </View>
            )}
          </View>

          {/* Section 3: Tổng quan hóa đơn */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tóm tắt hóa đơn</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính tiền hàng</Text>
              <Text style={styles.summaryValue}>{cartSubtotal.toLocaleString("vi-VN")}đ</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelDiscount}>Giảm giá ({appliedCoupon})</Text>
                <Text style={styles.summaryValueDiscount}>
                  -{discountAmount.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={styles.summaryValue}>{SHIPPING_FEE.toLocaleString("vi-VN")}đ</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>{finalTotal.toLocaleString("vi-VN")}đ</Text>
            </View>
          </View>

          {/* Section 4: Phương thức thanh toán */}
          <Text style={styles.sectionHeading}>Phương thức thanh toán</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 24 }} />
          ) : (
            <View style={{ gap: 12, marginBottom: 24 }}>
              {/* COD option */}
              <TouchableOpacity
                style={[styles.paymentCard, (!addressConfirmed || loading) && styles.paymentCardDisabled]}
                onPress={() => handleChoosePayment("COD")}
                disabled={!addressConfirmed || loading}
              >
                <View style={styles.paymentIconBg}>
                  <Truck size={22} stroke="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTitle}>Thanh toán khi nhận hàng (COD)</Text>
                  <Text style={styles.paymentSub}>Nhận hàng và thanh toán tiền mặt cho shipper</Text>
                </View>
              </TouchableOpacity>

              {/* QR Option */}
              <TouchableOpacity
                style={[styles.paymentCard, styles.paymentCardHighlight, (!addressConfirmed || loading) && styles.paymentCardDisabled]}
                onPress={() => handleChoosePayment("QR")}
                disabled={!addressConfirmed || loading}
              >
                <View style={[styles.paymentIconBg, { backgroundColor: "#E8F5E9" }]}>
                  <QrCode size={22} stroke="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.paymentTitle}>Chuyển khoản QR (VietQR)</Text>
                    <View style={styles.fastBadge}>
                      <Text style={styles.fastBadgeText}>Nhanh nhất</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentSub}>Quét mã QR qua ngân hàng / Ví điện tử Momo/ZaloPay</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF5" },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A2E1A" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1A2E1A", marginBottom: 10 },
  addressInput: {
    backgroundColor: "#F9FAF7",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E5EBE1",
    minHeight: 70,
    textAlignVertical: "top",
  },
  confirmAddressButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10, paddingVertical: 11, borderRadius: 12, backgroundColor: "#EDF7EA", borderWidth: 1, borderColor: "#C8E6C9" },
  confirmAddressButtonDone: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  confirmAddressText: { color: "#2E7D32", fontSize: 12, fontWeight: "700" },
  confirmAddressTextDone: { color: "#fff" },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F0F7ED",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  locationButtonDisabled: { opacity: 0.6 },
  locationButtonText: { color: "#2E7D32", fontSize: 12, fontWeight: "700" },
  locationMapScreen: { flex: 1, backgroundColor: "#fff" },
  locationMapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: Platform.OS === "android" ? 42 : 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EEE7",
  },
  locationMapHeaderText: { flex: 1 },
  locationMapTitle: { color: "#1A2E1A", fontSize: 19, fontWeight: "800" },
  locationMapSubtitle: { color: "#718071", fontSize: 12, marginTop: 3 },
  locationMap: { flex: 1 },
  locationMapFooter: { padding: 16, paddingBottom: Platform.OS === "android" ? 28 : 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E8EEE7" },
  locationMapCoordinate: { color: "#718071", fontSize: 11, textAlign: "center", marginBottom: 10 },
  locationConfirmButton: { alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 14, backgroundColor: "#2E7D32" },
  locationConfirmButtonDisabled: { opacity: 0.7 },
  locationConfirmText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  paymentCardDisabled: { opacity: 0.45 },
  subLabel: { fontSize: 12, fontWeight: "600", color: "#666", marginTop: 4 },
  voucherSection: { marginBottom: 10 },
  voucherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F7ED",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  voucherPillSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  voucherPillText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  voucherPillTextSelected: { color: "#fff" },
  couponInputRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  couponInput: {
    flex: 1,
    backgroundColor: "#F9FAF7",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    borderWidth: 1,
    borderColor: "#E5EBE1",
  },
  applyCouponBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  applyCouponBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  removeCouponBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
  },
  removeCouponText: { color: "#d32f2f", fontWeight: "700", fontSize: 13 },
  btnDisabled: { backgroundColor: "#ccc" },
  statusBox: { marginTop: 10, padding: 10, borderRadius: 12 },
  statusSuccess: { backgroundColor: "#E8F5E9" },
  statusError: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 12, fontWeight: "600" },
  statusTextSuccess: { color: "#2E7D32" },
  statusTextError: { color: "#C62828" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: "#666" },
  summaryValue: { fontSize: 13, fontWeight: "600", color: "#333" },
  summaryLabelDiscount: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  summaryValueDiscount: { fontSize: 13, fontWeight: "700", color: "#2E7D32" },
  summaryValueFree: { fontSize: 13, fontWeight: "600", color: "#E65100" },
  divider: { height: 1, backgroundColor: "#E5EBE1", marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1A2E1A" },
  totalValue: { fontSize: 20, fontWeight: "800", color: "#2E7D32" },
  sectionHeading: { fontSize: 16, fontWeight: "700", color: "#1A2E1A", marginBottom: 12 },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5EBE1",
    gap: 14,
  },
  paymentCardHighlight: {
    borderColor: "#A5D6A7",
    backgroundColor: "#FAFDFA",
  },
  paymentIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F0F7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: { fontSize: 14, fontWeight: "700", color: "#1A2E1A" },
  paymentSub: { fontSize: 12, color: "#777", marginTop: 2 },
  fastBadge: { backgroundColor: "#E8F5E9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  fastBadgeText: { fontSize: 10, fontWeight: "700", color: "#2E7D32" },
});
