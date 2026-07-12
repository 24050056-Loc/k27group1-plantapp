import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, 
  Alert, TextInput, Modal, Platform 
} from "react-native";
import { User as UserIcon, Settings, CreditCard, HelpCircle, LogOut, ShoppingBag, Edit2, Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { getUserOrders } from "../../services/userService";
import { Order } from "../../types";

type Props = {
  onLogout: () => void;
  onSelectOrder?: (orderId: number) => void;
};

export default function ProfileScreen({ onLogout, onSelectOrder }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop"
  );
  
  // Form state
  const [formData, setFormData] = useState({
    ho_ten: user?.ho_ten || "",
    email: user?.email || "",
    so_dien_thoai: user?.so_dien_thoai || "",
    dia_chi: user?.dia_chi || "",
  });

  useEffect(() => {
    if (user?.id) {
      setLoadingOrders(true);
      getUserOrders(user.id)
        .then((data) => setOrders(data))
        .catch((err) => console.error("Lỗi lấy lịch sử đơn hàng:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  // Trả về màu tương ứng với trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status) {
      case "cho_duyet":
        return "#f57c00"; // Cam
      case "dang_xu_ly":
      case "dang_giao":
        return "#0288d1"; // Xanh dương
      case "da_giao":
      case "da_thu/da_xu_ly":
      case "da_thu/da_xac_nhan":
        return "#2e7d32"; // Xanh lá
      case "da_huy":
        return "#d32f2f"; // Đỏ
      default:
        return "#666";
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "cho_duyet": return "Chờ duyệt";
      case "dang_xu_ly": return "Đang xử lý";
      case "dang_giao": return "Đang giao";
      case "da_giao": return "Đã giao";
      case "da_huy": return "Đã hủy";
      case "da_thu/da_xu_ly": return "Đã thu/Đang xử lý";
      case "da_thu/da_xac_nhan": return "Đã thanh toán";
      default: return status;
    }
  };

  const openEditModal = () => {
    setFormData({
      ho_ten: user?.ho_ten || "",
      email: user?.email || "",
      so_dien_thoai: user?.so_dien_thoai || "",
      dia_chi: user?.dia_chi || "",
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!formData.ho_ten.trim()) {
      Alert.alert("Lỗi", "Tên không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Gọi API để update user info
      // await updateUserProfile(user?.id, formData);
      
      // Giả lập lưu thành công
      await new Promise((r) => setTimeout(r, 800));
      
      Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật");
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu thông tin. Vui lòng thử lại");
    } finally {
      setIsSaving(false);
    }
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh. Vui lòng vào Settings và cấp quyền."
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Ứng dụng cần quyền truy cập camera. Vui lòng vào Settings và cấp quyền."
      );
      return false;
    }
    return true;
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setAvatarUrl(uri);
        setIsImagePickerVisible(false);
        Alert.alert("Thành công", "Ảnh đã được chọn. Nhấn 'Lưu thay đổi' để cập nhật.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setAvatarUrl(uri);
        setIsImagePickerVisible(false);
        Alert.alert("Thành công", "Ảnh đã được chụp. Nhấn 'Lưu thay đổi' để cập nhật.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chụp ảnh. Vui lòng thử lại.");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{user?.ho_ten || user?.ten_dang_nhap || "Khách Hàng"}</Text>
          <Text style={styles.role}>{user?.email || "Chưa cập nhật email"}</Text>
          <Text style={styles.badgeRole}>{user?.vai_tro === "admin" ? "Quản trị viên" : "Thành viên"}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Edit2 size={18} stroke="#2E7D32" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.row}>
          <UserIcon size={18} stroke="#2E7D32" />
          <Text style={styles.rowText}>Tên đăng nhập: {user?.ten_dang_nhap}</Text>
        </View>
        <View style={styles.row}>
          <CreditCard size={18} stroke="#2E7D32" />
          <Text style={styles.rowText}>SĐT: {user?.so_dien_thoai || "Chưa cập nhật"}</Text>
        </View>
        <View style={styles.row}>
          <Settings size={18} stroke="#2E7D32" />
          <Text style={styles.rowText} numberOfLines={2}>Địa chỉ: {user?.dia_chi || "Chưa cập nhật"}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Lịch sử mua hàng</Text>
      
      {loadingOrders ? (
        <ActivityIndicator color="#2E7D32" style={{ marginVertical: 10 }} />
      ) : (
        <View style={styles.ordersContainer}>
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => onSelectOrder?.(order.id)}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Đơn hàng #{order.id}</Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order.trang_thai) }]}>
                  {getStatusName(order.trang_thai)}
                </Text>
              </View>
              <Text style={styles.orderDate}>Ngày đặt: {new Date(order.ngay_dat_hang).toLocaleDateString("vi-VN")}</Text>
              <Text style={styles.orderAddress} numberOfLines={1}>Giao tới: {order.dia_chi_giao_hang}</Text>
              {order.tong_thanh_toan && (
                <Text style={styles.orderTotal}>
                  Tổng tiền: {parseFloat(order.tong_thanh_toan).toLocaleString("vi-VN")}đ
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {orders.length === 0 && (
            <View style={styles.emptyOrders}>
              <ShoppingBag size={32} stroke="#ccc" />
              <Text style={styles.emptyOrdersText}>Bạn chưa có đơn hàng nào.</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <LogOut size={16} stroke="#fff" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Image Picker Modal */}
      <Modal
        visible={isImagePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsImagePickerVisible(false)}
      >
        <View style={styles.imagePickerOverlay}>
          <View style={styles.imagePickerContent}>
            <View style={styles.imagePickerHeader}>
              <Text style={styles.imagePickerTitle}>Chọn ảnh đại diện</Text>
              <TouchableOpacity onPress={() => setIsImagePickerVisible(false)}>
                <X size={24} stroke="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.imagePickerOptions}>
              <TouchableOpacity 
                style={styles.imagePickerOption}
                onPress={takePhoto}
              >
                <Camera size={40} stroke="#2E7D32" />
                <Text style={styles.imagePickerOptionText}>Chụp ảnh mới</Text>
                <Text style={styles.imagePickerOptionDesc}>Dùng camera để chụp ảnh</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.imagePickerOption}
                onPress={pickImageFromLibrary}
              >
                <ShoppingBag size={40} stroke="#2E7D32" />
                <Text style={styles.imagePickerOptionText}>Chọn từ thư viện</Text>
                <Text style={styles.imagePickerOptionDesc}>Chọn ảnh đã lưu trong điện thoại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <X size={24} stroke="#333" />
              </TouchableOpacity>
            </View>

            {/* Avatar Section */}
            <TouchableOpacity 
              style={styles.avatarSection}
              onPress={() => setIsImagePickerVisible(true)}
            >
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.largeAvatar} 
              />
              <View style={styles.changeAvatarButton}>
                <Camera size={20} stroke="#fff" />
                <Text style={styles.changeAvatarText}>Đổi ảnh</Text>
              </View>
            </TouchableOpacity>

            {/* Form Fields */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập họ và tên"
                  value={formData.ho_ten}
                  onChangeText={(text) => setFormData({ ...formData, ho_ten: text })}
                  placeholderTextColor="#ccc"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholderTextColor="#ccc"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập số điện thoại"
                  value={formData.so_dien_thoai}
                  onChangeText={(text) => setFormData({ ...formData, so_dien_thoai: text })}
                  placeholderTextColor="#ccc"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  placeholder="Nhập địa chỉ"
                  value={formData.dia_chi}
                  onChangeText={(text) => setFormData({ ...formData, dia_chi: text })}
                  placeholderTextColor="#ccc"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsEditModalVisible(false)}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20, 
    paddingTop: Platform.OS === "android" ? 52 : 20,
  },
  profileHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16, 
    marginBottom: 24,
    position: "relative",
  },
  headerInfo: {
    flex: 1,
  },
  avatar: { 
    width: 72, 
    height: 72, 
    borderRadius: 24, 
    backgroundColor: "#f0f0f0" 
  },
  name: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#1A2E1A" 
  },
  role: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 2 
  },
  badgeRole: { 
    alignSelf: "flex-start", 
    backgroundColor: "#e8f5e9", 
    color: "#2e7d32", 
    fontSize: 11, 
    fontWeight: "700", 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginTop: 6 
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDF3E8",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: { 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "#eee", 
    padding: 16, 
    gap: 14, 
    marginBottom: 20 
  },
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f0f0f0" 
  },
  rowText: { 
    fontSize: 14, 
    color: "#333", 
    fontWeight: "600", 
    flex: 1 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1A2E1A", 
    marginBottom: 14 
  },
  ordersContainer: { 
    gap: 12,
    marginBottom: 20,
  },
  orderCard: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#eee", 
    padding: 14 
  },
  orderHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 6 
  },
  orderId: { 
    fontWeight: "700", 
    color: "#333" 
  },
  orderStatus: { 
    fontSize: 12, 
    fontWeight: "700" 
  },
  orderDate: { 
    fontSize: 12, 
    color: "#888", 
    marginBottom: 4 
  },
  orderAddress: { 
    fontSize: 13, 
    color: "#666", 
    marginBottom: 4 
  },
  orderTotal: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#2E7D32", 
    textAlign: "right" 
  },
  emptyOrders: { 
    alignItems: "center", 
    gap: 8, 
    paddingVertical: 20 
  },
  emptyOrdersText: { 
    color: "#888", 
    fontSize: 13 
  },
  logoutButton: { 
    marginTop: 28, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 10, 
    backgroundColor: "#e53935", 
    paddingVertical: 14, 
    borderRadius: 16, 
    marginBottom: 40 
  },
  logoutText: { 
    color: "#fff", 
    fontWeight: "700" 
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changeAvatarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  changeAvatarText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  formContainer: {
    paddingHorizontal: 20,
    maxHeight: "60%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9fafb",
  },
  textAreaInput: {
    height: 100,
    paddingTop: 12,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  cancelButtonText: {
    color: "#6B7F6B",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  // Image Picker Modal Styles
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  imagePickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imagePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  imagePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E1A",
  },
  imagePickerOptions: {
    gap: 12,
  },
  imagePickerOption: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E8F5E9",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#FAFBF8",
    gap: 8,
  },
  imagePickerOptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginTop: 8,
  },
  imagePickerOptionDesc: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
});

