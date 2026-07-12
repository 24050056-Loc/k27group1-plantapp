import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ChevronLeft, Trash2, Phone, MapPin } from "lucide-react-native";
import { OrderDetail } from "../../types";
import { resolveProductImageByName } from "../../assets/productImages";

type Props = {
  orderId: number;
  onBack: () => void;
};

export default function OrderDetailScreen({ orderId, onBack }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      // TODO: Gọi API để lấy chi tiết đơn hàng: GET /order/{orderId}
      // const response = await getOrderDetail(orderId);
      // setOrder(response);

      // Giả lập dữ liệu cho testing
      await new Promise((r) => setTimeout(r, 500));
      setOrder({
        id: orderId,
        user_id: 999,
        tong_thanh_toan: "250000",
        trang_thai: "dang_xu_ly",
        ngay_dat_hang: new Date().toISOString(),
        dia_chi_giao_hang: "123 Đường ABC, Quận 1, TP.HCM",
        so_dien_thoai_nhan: "0901234567",
        ten_nguoi_nhan: "Nguyễn Văn A",
        phi_van_chuyen: "30000",
        items: [
          {
            id: 1,
            order_id: orderId,
            product_id: 1,
            ten_san_pham: "Cây Bàng Đài Loan",
            so_luong: 1,
            gia_tien: "250000",
            hinh_anh_url: "cay_bang_dai_loan.jpg",
          },
        ],
      });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const canCancelOrder = () => {
    if (!order) return false;
    return ["cho_duyet", "dang_xu_ly"].includes(order.trang_thai);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cho_duyet":
        return "#f57c00";
      case "dang_xu_ly":
      case "dang_giao":
        return "#0288d1";
      case "da_giao":
      case "da_thu/da_xu_ly":
        return "#2e7d32";
      case "da_huy":
        return "#d32f2f";
      default:
        return "#666";
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "cho_duyet":
        return "Chờ duyệt";
      case "dang_xu_ly":
        return "Đang xử lý";
      case "dang_giao":
        return "Đang giao";
      case "da_giao":
        return "Đã giao";
      case "da_huy":
        return "Đã hủy";
      case "da_thu/da_xu_ly":
        return "Đã thanh toán";
      default:
        return status;
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Xác nhận hủy đơn hàng",
      `Bạn có chắc muốn hủy đơn hàng #${order?.id}?`,
      [
        { text: "Không", onPress: () => {} },
        {
          text: "Có, hủy đơn",
          onPress: async () => {
            setCancelling(true);
            try {
              // TODO: Gọi API hủy đơn hàng: PUT /order/{orderId}/cancel
              // await cancelOrder(orderId);

              // Giả lập hủy thành công
              await new Promise((r) => setTimeout(r, 800));

              if (order) {
                setOrder({ ...order, trang_thai: "da_huy" });
              }
              Alert.alert("Thành công", "Đơn hàng đã được hủy");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể hủy đơn hàng. Vui lòng thử lại");
            } finally {
              setCancelling(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.gia_tien) * item.so_luong,
    0
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={22} stroke="#1A2E1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderIdLabel}>Mã đơn hàng</Text>
            <Text style={styles.orderId}>#{order.id}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Trạng thái</Text>
            <Text
              style={[
                styles.statusBadge,
                { color: getStatusColor(order.trang_thai) },
              ]}
            >
              {getStatusName(order.trang_thai)}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Ngày đặt hàng</Text>
            <Text style={styles.dateValue}>
              {new Date(order.ngay_dat_hang).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>

        {/* Recipient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
          <View style={styles.recipientCard}>
            <View style={styles.recipientRow}>
              <Text style={styles.label}>Tên người nhận:</Text>
              <Text style={styles.value}>{order.ten_nguoi_nhan || "N/A"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.recipientRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.iconRow}>
                  <Phone size={14} stroke="#666" />
                  <Text style={styles.label}>Số điện thoại</Text>
                </View>
                <Text style={styles.value}>
                  {order.so_dien_thoai_nhan || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />

            <View style={styles.recipientRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.iconRow}>
                  <MapPin size={14} stroke="#666" />
                  <Text style={styles.label}>Địa chỉ giao</Text>
                </View>
                <Text style={[styles.value, { marginTop: 4 }]}>
                  {order.dia_chi_giao_hang}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đặt hàng</Text>
          {order.items.map((item, idx) => (
            <View key={item.id} style={styles.productItem}>
              <Image
                source={resolveProductImageByName(item.ten_san_pham)}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.ten_san_pham}
                </Text>
                <Text style={styles.productPrice}>
                  {parseFloat(item.gia_tien).toLocaleString("vi-VN")}đ
                </Text>
                <Text style={styles.productQty}>x{item.so_luong}</Text>
              </View>
              <Text style={styles.productTotal}>
                {(parseFloat(item.gia_tien) * item.so_luong).toLocaleString(
                  "vi-VN"
                )}
                đ
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>
                {subtotal.toLocaleString("vi-VN")}đ
              </Text>
            </View>

            {order.phi_van_chuyen && (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  <Text style={styles.summaryValue}>
                    {parseFloat(order.phi_van_chuyen).toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </>
            )}

            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Tổng cộng</Text>
              <Text style={styles.summaryValueBold}>
                {parseFloat(order.tong_thanh_toan).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        {canCancelOrder() && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Trash2 size={16} stroke="#fff" />
                <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7F6B",
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 14,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDF3E8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  // Info Card
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
  },
  orderIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#6B7F6B",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: "#6B7F6B",
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7F6B",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 12,
  },
  // Recipient
  recipientCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
  },
  recipientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    color: "#6B7F6B",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  // Products
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#EDF3E8",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    lineHeight: 18,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
    marginBottom: 2,
  },
  productQty: {
    fontSize: 12,
    color: "#6B7F6B",
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  // Summary
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7F6B",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
  },
  // Buttons
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#d32f2f",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
