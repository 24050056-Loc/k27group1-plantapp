import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  X,
  Phone,
  MapPin,
  User,
  Mail,
  Edit,
  RefreshCw,
  Tag,
  Eye,
  Check
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { resolveProductImage } from '../../assets/productImages';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

interface OrderItem {
  id: number;
  user_id: number;
  ho_ten: string;
  email?: string;
  so_dien_thoai: string;
  dia_chi_giao_hang: string;
  tong_tien_hang: number;
  so_tien_giam_gia: number;
  tong_thanh_toan: number;
  trang_thai: string;
  phuong_thuc_thanh_toan?: string;
  ma_giam_gia?: string;
  ngay_dat_hang: string;
}

interface OrderDetailProduct {
  id: number;
  product_id: number;
  so_luong: number;
  don_gia: number;
  ten_san_pham?: string;
  hinh_anh_url?: string;
}

// Chuẩn hóa trạng thái đơn hàng về 4 nhóm chính theo quy trình một chiều
export function getNormStatus(st: string): 'cho_xu_ly' | 'dang_giao' | 'hoan_thanh' | 'da_huy' {
  if (!st) return 'cho_xu_ly';
  const s = String(st).toLowerCase().trim();
  if (['cho_duyet', 'cho_xu_ly', 'dang_xu_ly'].includes(s)) return 'cho_xu_ly';
  if (s === 'dang_giao') return 'dang_giao';
  if (['hoan_thanh', 'da_giao'].includes(s) || s.startsWith('da_thu')) return 'hoan_thanh';
  if (s === 'da_huy') return 'da_huy';
  return 'cho_xu_ly';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; iconText: string }> = {
  cho_xu_ly: { label: "Chờ xử lý", color: "#E65100", bgColor: "#FFF3E0", iconText: "🟡" },
  dang_giao: { label: "Đang giao", color: "#1565C0", bgColor: "#E3F2FD", iconText: "🔵" },
  hoan_thanh: { label: "Hoàn thành", color: "#2E7D32", bgColor: "#E8F5E9", iconText: "🟢" },
  da_huy: { label: "Đã hủy", color: "#C62828", bgColor: "#FFEBEE", iconText: "🔴" },
};

export default function AdminOrdersScreen({ onBack }: { onBack: () => void }) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Edit Delivery Address modal
  const [editAddressModalVisible, setEditAddressModalVisible] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<OrderItem | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Detail items modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [detailItems, setDetailItems] = useState<OrderDetailProduct[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`${BASE_URL}/adminorder`, { headers });
      let data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        res = await fetch(`${BASE_URL}/api/admin/orders`, { headers });
        data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy đơn hàng:", err);
      Alert.alert("Lỗi", "Không thể lấy danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Xử lý chuyển trạng thái đơn hàng một chiều (có Confirm Dialog bắt buộc)
  const handleTransitionStatus = (order: OrderItem, targetStatus: 'dang_giao' | 'hoan_thanh' | 'da_huy') => {
    let title = "Xác nhận chuyển trạng thái";
    let message = "";
    let confirmText = "Xác nhận";
    let isDestructive = false;

    if (targetStatus === 'dang_giao') {
      message = `Bạn có chắc muốn chuyển đơn hàng #${order.id} sang trạng thái "Đang giao hàng" không?`;
      confirmText = "Xác nhận giao";
    } else if (targetStatus === 'hoan_thanh') {
      message = `Bạn có chắc muốn xác nhận đơn hàng #${order.id} đã "Hoàn thành" giao cho khách không? Sau khi hoàn thành, trạng thái không thể thay đổi.`;
      confirmText = "Xác nhận hoàn thành";
    } else if (targetStatus === 'da_huy') {
      title = "Cảnh báo hủy đơn hàng";
      message = `Bạn có chắc muốn hủy đơn hàng #${order.id}? Sau khi hủy, đơn hàng sẽ không thể khôi phục và số lượng kho sẽ được hoàn trả tự động.`;
      confirmText = "Xác nhận hủy";
      isDestructive = true;
    }

    Alert.alert(
      title,
      message,
      [
        { text: "Quay lại", style: "cancel" },
        {
          text: confirmText,
          style: isDestructive ? "destructive" : "default",
          onPress: async () => {
            setUpdatingId(order.id);
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (token) headers['Authorization'] = `Bearer ${token}`;

              // Gọi API cập nhật trạng thái
              const res = await fetch(`${BASE_URL}/api/admin/orders/${order.id}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: targetStatus })
              });
              const data = await res.json();

              if (data.success) {
                Alert.alert("Thành công", data.message || "Đã cập nhật trạng thái đơn hàng!");
                // Nếu đang mở modal chi tiết thì cập nhật selectedOrder
                if (selectedOrder && selectedOrder.id === order.id) {
                  setSelectedOrder({ ...selectedOrder, trang_thai: targetStatus });
                }
                fetchOrders();
              } else {
                Alert.alert("Không thể chuyển trạng thái", data.message || "Lỗi cập nhật trạng thái.");
              }
            } catch (err) {
              console.error("Lỗi chuyển trạng thái:", err);
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối tới máy chủ.");
            } finally {
              setUpdatingId(null);
            }
          }
        }
      ]
    );
  };

  const openEditAddressModal = (order: OrderItem) => {
    setSelectedOrderForEdit(order);
    setNewAddress(order.dia_chi_giao_hang || '');
    setEditAddressModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!selectedOrderForEdit) return;
    if (!newAddress.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập địa chỉ giao hàng!");
      return;
    }

    setSavingAddress(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/api/admin/orders/${selectedOrderForEdit.id}/info`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ dia_chi_giao_hang: newAddress.trim() })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Thành công", "Đã cập nhật địa chỉ giao hàng!");
        setEditAddressModalVisible(false);
        if (selectedOrder && selectedOrder.id === selectedOrderForEdit.id) {
          setSelectedOrder({ ...selectedOrder, dia_chi_giao_hang: newAddress.trim() });
        }
        fetchOrders();
      } else {
        Alert.alert("Thông báo", data.message || "Không thể cập nhật địa chỉ.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật địa chỉ.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleOpenDetail = async (order: OrderItem) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${BASE_URL}/orders/${order.id}`);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.items)) {
        setDetailItems(data.data.items);
      } else if (Array.isArray(data.items)) {
        setDetailItems(data.items);
      } else {
        setDetailItems([]);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết đơn hàng:", err);
      setDetailItems([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter orders by status & search
  const filteredOrders = orders.filter(item => {
    const norm = getNormStatus(item.trang_thai);
    let matchStatus = true;
    if (statusFilter !== 'all') {
      matchStatus = (norm === statusFilter);
    }

    const term = search.toLowerCase().trim();
    const matchSearch =
      !term ||
      item.id.toString().includes(term) ||
      (item.ho_ten && item.ho_ten.toLowerCase().includes(term)) ||
      (item.email && item.email.toLowerCase().includes(term)) ||
      (item.so_dien_thoai && item.so_dien_thoai.includes(term));

    return matchStatus && matchSearch;
  });

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    const norm = getNormStatus(item.trang_thai);
    const statusCfg = STATUS_CONFIG[norm] || STATUS_CONFIG.cho_xu_ly;
    const isProcessing = updatingId === item.id;

    return (
      <View style={styles.orderCard}>
        {/* Card Header: Mã đơn + Badge Trạng thái */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderIdText}>Đơn hàng #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.iconText} {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Thông tin Khách hàng */}
        <View style={styles.cardSection}>
          <View style={styles.infoRow}>
            <User size={15} color="#444" />
            <Text style={styles.infoTextBold}>{item.ho_ten || 'Khách vãng lai'}</Text>
          </View>
          {item.so_dien_thoai && (
            <View style={styles.infoRow}>
              <Phone size={15} color="#555" />
              <Text style={styles.infoText}>{item.so_dien_thoai}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.infoRow}>
              <Mail size={15} color="#555" />
              <Text style={styles.infoText}>{item.email}</Text>
            </View>
          )}
          {item.dia_chi_giao_hang && (
            <View style={styles.infoRow}>
              <MapPin size={15} color="#555" />
              <Text style={styles.infoText} numberOfLines={2}>{item.dia_chi_giao_hang}</Text>
              <TouchableOpacity onPress={() => openEditAddressModal(item)} style={{ padding: 3, marginLeft: 4 }}>
                <Edit size={14} color="#1565C0" />
              </TouchableOpacity>
            </View>
          )}
          {item.ma_giam_gia && (
            <View style={styles.infoRow}>
              <Tag size={14} color="#E65100" />
              <Text style={[styles.infoText, { color: '#E65100', fontWeight: '600' }]}>
                Voucher: {item.ma_giam_gia} (-{Number(item.so_tien_giam_gia || 0).toLocaleString('vi-VN')} đ)
              </Text>
            </View>
          )}
        </View>

        {/* Thời gian & Tổng tiền */}
        <View style={styles.cardDivider} />
        <View style={styles.rowBetween}>
          <View style={styles.infoRow}>
            <Clock size={13} color="#888" />
            <Text style={styles.dateText}>
              {new Date(item.ngay_dat_hang).toLocaleDateString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Tổng thanh toán: </Text>
            <Text style={styles.amountValue}>
              {Number(item.tong_thanh_toan || 0).toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* Hàng nút hành động theo quy trình một chiều */}
        <View style={styles.actionRow}>
          {/* Nút Xem chi tiết (luôn có sẵn ở mọi trạng thái) */}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => handleOpenDetail(item)}
          >
            <Eye size={14} color="#333" />
            <Text style={styles.detailBtnText}>Chi tiết</Text>
          </TouchableOpacity>

          {isProcessing ? (
            <ActivityIndicator size="small" color="#2E7D32" style={{ marginLeft: 10 }} />
          ) : (
            <>
              {/* TRƯỜNG HỢP 1: Chờ xử lý -> Có thể chuyển sang 'dang_giao' HOẶC 'da_huy' */}
              {norm === 'cho_xu_ly' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleTransitionStatus(item, 'da_huy')}
                  >
                    <XCircle size={14} color="#C62828" />
                    <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shipBtn}
                    onPress={() => handleTransitionStatus(item, 'dang_giao')}
                  >
                    <Truck size={14} color="#fff" />
                    <Text style={styles.shipBtnText}>Xác nhận giao</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TRƯỜNG HỢP 2: Đang giao -> Chỉ có thể chuyển sang 'hoan_thanh' */}
              {norm === 'dang_giao' && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => handleTransitionStatus(item, 'hoan_thanh')}
                >
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={styles.completeBtnText}>Hoàn thành</Text>
                </TouchableOpacity>
              )}

              {/* TRƯỜNG HỢP 3: Hoàn thành -> Trạng thái cuối, không hiển thị nút chuyển nữa */}
              {norm === 'hoan_thanh' && (
                <View style={styles.terminalBadgeComplete}>
                  <Check size={13} color="#2E7D32" />
                  <Text style={styles.terminalTextComplete}>✓ Đã hoàn thành</Text>
                </View>
              )}

              {/* TRƯỜNG HỢP 4: Đã hủy -> Trạng thái cuối, không hiển thị nút chuyển nữa */}
              {norm === 'da_huy' && (
                <View style={styles.terminalBadgeCancelled}>
                  <X size={13} color="#C62828" />
                  <Text style={styles.terminalTextCancelled}>✕ Đã hủy</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Quản lý Đơn hàng</Text>
            <Text style={styles.headerSubTitle}>Quy trình chuyển trạng thái 1 chiều</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
          <RefreshCw size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã đơn, tên khách, SĐT, email..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.searchIcon}>
          <Search size={18} color="#777" />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'cho_xu_ly', label: '🟡 Chờ xử lý' },
            { key: 'dang_giao', label: '🔵 Đang giao' },
            { key: 'hoan_thanh', label: '🟢 Hoàn thành' },
            { key: 'da_huy', label: '🔴 Đã hủy' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, statusFilter === tab.key && styles.tabChipActive]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[styles.tabChipText, statusFilter === tab.key && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Order List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={{ marginTop: 10, color: '#666' }}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          refreshing={loading}
          onRefresh={fetchOrders}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào</Text>
            </View>
          }
        />
      )}

      {/* Edit Address Modal */}
      <Modal visible={editAddressModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa địa chỉ đơn #{selectedOrderForEdit?.id}</Text>
              <TouchableOpacity onPress={() => setEditAddressModalVisible(false)}>
                <X size={20} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 14 }}>
              <Text style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' }}>Địa chỉ giao hàng:</Text>
              <TextInput
                style={styles.addressInput}
                multiline
                value={newAddress}
                onChangeText={setNewAddress}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setEditAddressModalVisible(false)}
                disabled={savingAddress}
              >
                <Text style={styles.modalSecondaryBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveAddress}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Lưu địa chỉ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Items Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chi tiết đơn hàng #{selectedOrder?.id}</Text>
                {selectedOrder && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>Trạng thái: </Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: STATUS_CONFIG[getNormStatus(selectedOrder.trang_thai)]?.color }}>
                      {STATUS_CONFIG[getNormStatus(selectedOrder.trang_thai)]?.iconText} {STATUS_CONFIG[getNormStatus(selectedOrder.trang_thai)]?.label}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X size={22} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Receiver Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionHeader}>Thông tin khách hàng & Giao nhận</Text>
                <Text style={styles.detailText}>• Người nhận: <Text style={{ fontWeight: '600' }}>{selectedOrder?.ho_ten || 'Khách vãng lai'}</Text></Text>
                {selectedOrder?.email && <Text style={styles.detailText}>• Email: {selectedOrder.email}</Text>}
                <Text style={styles.detailText}>• SĐT: {selectedOrder?.so_dien_thoai || 'Chưa cung cấp'}</Text>
                <Text style={styles.detailText}>• Địa chỉ: {selectedOrder?.dia_chi_giao_hang || 'Chưa có địa chỉ'}</Text>
                {selectedOrder?.ma_giam_gia && (
                  <Text style={[styles.detailText, { color: '#E65100', fontWeight: '600' }]}>
                    • Mã voucher: {selectedOrder.ma_giam_gia}
                  </Text>
                )}
              </View>

              {/* Items List */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionHeader}>Danh sách sản phẩm trong đơn</Text>
                {loadingDetail ? (
                  <ActivityIndicator size="small" color="#2E7D32" style={{ marginVertical: 15 }} />
                ) : detailItems.length > 0 ? (
                  detailItems.map((prod, idx) => (
                    <View key={idx} style={styles.detailProductRow}>
                      <Image
                        source={resolveProductImage(prod.hinh_anh_url)}
                        style={styles.detailProdImg}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailProdName} numberOfLines={2}>
                          {prod.ten_san_pham || `Sản phẩm #${prod.product_id}`}
                        </Text>
                        <Text style={styles.detailProdQty}>Số lượng: x{prod.so_luong}</Text>
                      </View>
                      <Text style={styles.detailProdPrice}>
                        {(prod.don_gia * prod.so_luong).toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyItemsText}>Không có dữ liệu chi tiết sản phẩm.</Text>
                )}
              </View>

              {/* Pricing breakdown */}
              <View style={styles.pricingSection}>
                <View style={styles.rowBetween}>
                  <Text style={styles.priceLabel}>Tạm tính tiền hàng:</Text>
                  <Text style={styles.priceVal}>
                    {Number(selectedOrder?.tong_tien_hang || 0).toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                {Number(selectedOrder?.so_tien_giam_gia || 0) > 0 && (
                  <View style={styles.rowBetween}>
                    <Text style={styles.priceLabel}>Voucher giảm giá:</Text>
                    <Text style={[styles.priceVal, { color: '#2E7D32' }]}>
                      -{Number(selectedOrder?.so_tien_giam_gia).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                )}
                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                  <Text style={styles.totalPriceLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.totalPriceVal}>
                    {Number(selectedOrder?.tong_thanh_toan || 0).toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>

              {/* Nút thao tác nhanh trong modal chi tiết */}
              {selectedOrder && (
                <View style={{ marginBottom: 20 }}>
                  {getNormStatus(selectedOrder.trang_thai) === 'cho_xu_ly' && (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.cancelBtn, { flex: 1, paddingVertical: 10, justifyContent: 'center' }]}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleTransitionStatus(selectedOrder, 'da_huy');
                        }}
                      >
                        <XCircle size={16} color="#C62828" />
                        <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.shipBtn, { flex: 1, paddingVertical: 10, justifyContent: 'center' }]}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleTransitionStatus(selectedOrder, 'dang_giao');
                        }}
                      >
                        <Truck size={16} color="#fff" />
                        <Text style={styles.shipBtnText}>Giao hàng</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {getNormStatus(selectedOrder.trang_thai) === 'dang_giao' && (
                    <TouchableOpacity
                      style={[styles.completeBtn, { paddingVertical: 10, justifyContent: 'center' }]}
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleTransitionStatus(selectedOrder, 'hoan_thanh');
                      }}
                    >
                      <CheckCircle2 size={16} color="#fff" />
                      <Text style={styles.completeBtnText}>Xác nhận hoàn thành</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#2E7D32',
    paddingTop: 45
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  refreshBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
  searchContainer: {
    position: 'relative',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingLeft: 36,
    paddingRight: 10,
    height: 40,
    backgroundColor: '#FAFAFA'
  },
  searchIcon: { position: 'absolute', left: 20, top: 20 },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8
  },
  tabsScroll: { paddingHorizontal: 10, gap: 8 },
  tabChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F0F0F0'
  },
  tabChipActive: { backgroundColor: '#2E7D32' },
  tabChipText: { fontSize: 13, color: '#555' },
  tabChipTextActive: { color: '#fff', fontWeight: 'bold' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  orderIdText: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  cardSection: { gap: 5, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTextBold: { fontSize: 14, fontWeight: '600', color: '#222' },
  infoText: { fontSize: 13, color: '#555', flex: 1 },
  cardDivider: { height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#888' },
  amountContainer: { flexDirection: 'row', alignItems: 'baseline' },
  amountLabel: { fontSize: 13, color: '#444' },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F0F0F0'
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6
  },
  detailBtnText: { fontSize: 13, color: '#333', fontWeight: '600' },
  shipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#1565C0',
    borderRadius: 6
  },
  shipBtnText: { fontSize: 13, color: '#fff', fontWeight: 'bold' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2'
  },
  cancelBtnText: { fontSize: 13, color: '#C62828', fontWeight: 'bold' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#2E7D32',
    borderRadius: 6
  },
  completeBtnText: { fontSize: 13, color: '#fff', fontWeight: 'bold' },
  terminalBadgeComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8F5E9',
    borderRadius: 6
  },
  terminalTextComplete: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold' },
  terminalBadgeCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFEBEE',
    borderRadius: 6
  },
  terminalTextCancelled: { fontSize: 12, color: '#C62828', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', fontSize: 15 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16
  },
  statusModalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    backgroundColor: '#FAFAFA'
  },
  modalSecondaryBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#EEE',
    borderRadius: 6,
    alignItems: 'center'
  },
  modalSecondaryBtnText: { color: '#555', fontWeight: '600' },
  modalPrimaryBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#2E7D32',
    borderRadius: 6,
    alignItems: 'center'
  },
  modalPrimaryBtnText: { color: '#fff', fontWeight: 'bold' },
  detailModalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '88%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  detailSection: { marginBottom: 16 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8 },
  detailText: { fontSize: 13, color: '#444', marginBottom: 4 },
  detailProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    gap: 10
  },
  detailProdImg: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#EEE' },
  detailProdName: { fontSize: 13, fontWeight: '600', color: '#222' },
  detailProdQty: { fontSize: 12, color: '#777', marginTop: 2 },
  detailProdPrice: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F' },
  emptyItemsText: { color: '#888', fontStyle: 'italic', marginVertical: 8 },
  pricingSection: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16
  },
  priceLabel: { fontSize: 13, color: '#666' },
  priceVal: { fontSize: 13, fontWeight: '600', color: '#333' },
  totalPriceLabel: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  totalPriceVal: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' }
});
