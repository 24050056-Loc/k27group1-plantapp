import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Animated, PanResponder,
  Alert, TextInput, Modal, Platform 
} from "react-native";
import { User as UserIcon, Settings, CreditCard, HelpCircle, LogOut, ShoppingBag, Edit2, Camera, X, LocateFixed, Trash2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { getUserOrders, getUserProfile, updateUserAvatar, updateUserProfile } from "../../services/userService";
import { deleteOrder } from "../../services/orderService";
import { Order, DEFAULT_SHIPPING_FEE } from "../../types";

type Props = {
  onLogout: () => void;
  onSelectOrder?: (orderId: number) => void;
};

function SwipeableCancelledOrder({
  children,
  onPress,
  onDelete,
}: {
  children: React.ReactNode;
  onPress: () => void;
  onDelete: () => void;
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderMove: (_, gesture) => translateX.setValue(Math.max(-92, Math.min(0, gesture.dx))),
    onPanResponderRelease: (_, gesture) => Animated.spring(translateX, { toValue: gesture.dx < -55 ? -92 : 0, useNativeDriver: true }).start(),
  })).current;

  return (
    <View style={styles.orderSwipeWrapper}>
      <TouchableOpacity style={styles.orderDeleteBackground} onPress={onDelete}>
        <Trash2 size={18} color="#fff" />
        <Text style={styles.orderDeleteText}>Xóa</Text>
      </TouchableOpacity>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const normalizeAvatarUrl = (value?: string | null, fallback?: string) => {
  const safeFallback = fallback || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop";
  if (!value) return safeFallback;

  const trimmed = value.trim();
  if (!trimmed) return safeFallback;

  const driveMatch = trimmed.match(/(?:\/d\/|id=)([A-Za-z0-9_-]{10,})/);
  if (driveMatch?.[1] && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  return trimmed;
};

function formatDetectedAddress(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return "";

  // Some Android geocoders return a Plus Code in `name`; it is not a useful street address.
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

export default function ProfileScreen({ onLogout, onSelectOrder }: Props) {
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [addressCoordinates, setAddressCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocationMapVisible, setIsLocationMapVisible] = useState(false);
  const [locationRegion, setLocationRegion] = useState<Region | null>(null);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const defaultAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop";
  const [avatarUrl, setAvatarUrl] = useState(normalizeAvatarUrl(user?.avatar, defaultAvatar));
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    ho_ten: user?.ho_ten || "",
    email: user?.email || "",
    so_dien_thoai: user?.so_dien_thoai || "",
    dia_chi: user?.dia_chi || "",
  });

  useEffect(() => {
    setAvatarUrl(normalizeAvatarUrl(user?.avatar, defaultAvatar));
  }, [user?.avatar]);

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

  const refreshProfile = async () => {
    if (!user?.id) return;
    setIsRefreshingProfile(true);
    try {
      const refreshedUser = await getUserProfile(user.id);
      if (refreshedUser) {
        updateUser(refreshedUser);
        setAvatarUrl(normalizeAvatarUrl(refreshedUser.avatar, defaultAvatar));
        setFormData({
          ho_ten: refreshedUser.ho_ten || "",
          email: refreshedUser.email || "",
          so_dien_thoai: refreshedUser.so_dien_thoai || "",
          dia_chi: refreshedUser.dia_chi || "",
        });
      }
    } finally {
      setIsRefreshingProfile(false);
    }
  };

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
      setAddressCoordinates({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLocationRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      });
      setIsLocationMapVisible(true);
    } catch (error) {
      console.error("Lỗi xác định vị trí trong Profile:", error);
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
      setFormData(current => ({ ...current, dia_chi: detectedAddress }));
      setIsLocationMapVisible(false);
    } catch (error) {
      Alert.alert("Không thể xác định địa chỉ", "Vui lòng thử lại với vị trí khác.");
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const updateMapCoordinate = (coordinate: { latitude: number; longitude: number }) => {
    setAddressCoordinates(coordinate);
    setLocationRegion(current => current ? { ...current, ...coordinate } : null);
  };

  const handleSaveAvatar = async () => {
    if (!user?.id) return;

    const isLocalImage = ["file://", "content://", "blob:"].some(prefix => avatarUrl.startsWith(prefix));
    if (!isLocalImage) return;

    setIsUploadingAvatar(true);
    try {
      const updatedUser = await updateUserAvatar(user.id, avatarUrl);
      updateUser(updatedUser);
      setAvatarUrl(normalizeAvatarUrl(updatedUser.avatar, defaultAvatar));
      return updatedUser;
    } catch (error) {
      console.error("Lỗi cập nhật avatar:", error);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.");
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.ho_ten.trim()) {
      Alert.alert("Lỗi", "Tên không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      if (!user?.id) {
        throw new Error("Không tìm thấy người dùng");
      }

      const isLocalImage = ["file://", "content://", "blob:"].some(prefix => avatarUrl.startsWith(prefix));
      if (isLocalImage) {
        await handleSaveAvatar();
      }

      const updatedUser = await updateUserProfile(user.id, {
        ho_ten: formData.ho_ten.trim(),
        email: formData.email.trim(),
        so_dien_thoai: formData.so_dien_thoai.trim(),
        dia_chi: formData.dia_chi.trim(),
      });
      updateUser(updatedUser);
      await refreshProfile();

      Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật");
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu thông tin. Vui lòng thử lại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCancelledOrder = (orderId: number) => {
    if (deletingOrderId !== null) return;
    Alert.alert("Xóa đơn đã hủy", "Bạn có chắc muốn xóa đơn hàng này khỏi lịch sử?", [
      { text: "Không" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setDeletingOrderId(orderId);
          try {
            await deleteOrder(orderId);
            setOrders(current => current.filter(order => order.id !== orderId));
          } catch (error) {
            console.error("Lỗi xóa đơn đã hủy:", error);
            Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể xóa đơn đã hủy.");
          } finally {
            setDeletingOrderId(null);
          }
        },
      },
    ]);
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshingProfile}
          onRefresh={refreshProfile}
          colors={["#2E7D32"]}
        />
      }
    >
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

      <TouchableOpacity style={styles.refreshProfileButton} onPress={refreshProfile} disabled={isRefreshingProfile}>
        <Text style={styles.refreshProfileText}>
          {isRefreshingProfile ? "Đang cập nhật..." : "↻ Làm mới thông tin"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Lịch sử mua hàng</Text>
      
      {loadingOrders ? (
        <ActivityIndicator color="#2E7D32" style={{ marginVertical: 10 }} />
      ) : (
        <View style={styles.ordersContainer}>
          {orders.map((order) => {
            const content = (
              <>
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
                    Tổng tiền: {Number(order.tong_thanh_toan || 0).toLocaleString("vi-VN")}đ
                  </Text>
                )}
              </>
            );
            const card = <View style={styles.orderCard}>{content}</View>;
            return order.trang_thai === "da_huy" ? (
              <SwipeableCancelledOrder key={order.id} onPress={() => onSelectOrder?.(order.id)} onDelete={() => handleDeleteCancelledOrder(order.id)}>
                {card}
              </SwipeableCancelledOrder>
            ) : (
              <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => onSelectOrder?.(order.id)}>{content}</TouchableOpacity>
            );
          })}
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
                  onChangeText={(text) => {
                    setAddressCoordinates(null);
                    setFormData({ ...formData, dia_chi: text });
                  }}
                  placeholderTextColor="#ccc"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={useCurrentLocationForAddress}
                  disabled={locatingAddress}
                >
                  {locatingAddress ? <ActivityIndicator size="small" color="#2E7D32" /> : <LocateFixed size={16} color="#2E7D32" />}
                  <Text style={styles.locationButtonText}>{locatingAddress ? "Đang xác định..." : "Lấy địa chỉ từ vị trí hiện tại"}</Text>
                </TouchableOpacity>
                {addressCoordinates && (
                  <View style={styles.locationPreview}>
                    <Text style={styles.locationPreviewTitle}>Vị trí đã xác định, bạn có thể chỉnh sửa trước khi lưu:</Text>
                    <Text style={styles.locationPreviewText}>
                      Tọa độ {addressCoordinates.latitude.toFixed(6)}, {addressCoordinates.longitude.toFixed(6)}
                    </Text>
                    {locationRegion && (
                      <TouchableOpacity
                        style={styles.locationPreviewMapWrap}
                        onPress={() => setIsLocationMapVisible(true)}
                        activeOpacity={0.9}
                      >
                        <MapView
                          style={styles.locationPreviewMap}
                          initialRegion={locationRegion}
                          scrollEnabled={false}
                          zoomEnabled={false}
                          rotateEnabled={false}
                          pitchEnabled={false}
                          showsBuildings
                          showsPointsOfInterest
                          pointerEvents="none"
                        >
                          <Marker coordinate={addressCoordinates} />
                        </MapView>
                        <View style={styles.locationPreviewMapLabel}>
                          <Text style={styles.locationPreviewMapLabelText}>Chạm để chỉnh vị trí</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
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
                  style={[styles.saveButton, (isSaving || isUploadingAvatar) && styles.saveButtonDisabled]} 
                  onPress={handleSaveProfile}
                  disabled={isSaving || isUploadingAvatar}
                >
                  {isSaving || isUploadingAvatar ? (
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
      <Modal
        visible={isLocationMapVisible}
        animationType="slide"
        onRequestClose={() => setIsLocationMapVisible(false)}
      >
        <View style={styles.locationMapScreen}>
          <View style={styles.locationMapHeader}>
            <TouchableOpacity onPress={() => setIsLocationMapVisible(false)}>
              <X size={24} color="#1A2E1A" />
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
              onPress={(event) => updateMapCoordinate(event.nativeEvent.coordinate)}
              onRegionChangeComplete={(region) => setLocationRegion(region)}
              showsUserLocation
              showsMyLocationButton
              showsBuildings
              showsPointsOfInterest
              showsCompass
            >
              <Marker
                coordinate={addressCoordinates}
                draggable
                onDragEnd={(event) => updateMapCoordinate(event.nativeEvent.coordinate)}
                title="Vị trí giao hàng"
                description="Kéo ghim hoặc chạm bản đồ để điều chỉnh"
              />
            </MapView>
          )}
          <View style={styles.locationMapFooter}>
            <Text style={styles.locationMapCoordinate}>
              Tọa độ: {addressCoordinates?.latitude.toFixed(6)}, {addressCoordinates?.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity
              style={styles.locationConfirmButton}
              onPress={confirmMapLocation}
              disabled={isConfirmingLocation}
            >
              {isConfirmingLocation ? <ActivityIndicator color="#fff" /> : <Text style={styles.locationConfirmText}>Xác nhận vị trí này</Text>}
            </TouchableOpacity>
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
  refreshProfileButton: {
    alignSelf: "flex-start",
    marginTop: -8,
    marginBottom: 20,
    paddingVertical: 4,
  },
  refreshProfileText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "700",
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
  orderSwipeWrapper: { position: "relative", overflow: "hidden", borderRadius: 16 },
  orderDeleteBackground: { position: "absolute", top: 0, right: 0, bottom: 0, width: 92, borderRadius: 16, backgroundColor: "#D32F2F", alignItems: "center", justifyContent: "center", gap: 4 },
  orderDeleteText: { color: "#fff", fontSize: 11, fontWeight: "800" },
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
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EDF7EA",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  locationButtonText: { color: "#2E7D32", fontSize: 12, fontWeight: "700" },
  locationPreview: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F3F8F1",
    borderWidth: 1,
    borderColor: "#D5E8D2",
  },
  locationPreviewTitle: { color: "#356438", fontSize: 11, fontWeight: "700" },
  locationPreviewText: { color: "#718071", fontSize: 10, marginTop: 4 },
  locationPreviewMapWrap: { height: 150, overflow: "hidden", borderRadius: 12, marginTop: 10, position: "relative" },
  locationPreviewMap: { ...StyleSheet.absoluteFillObject },
  locationPreviewMapLabel: { position: "absolute", bottom: 8, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  locationPreviewMapLabelText: { color: "#356438", fontSize: 10, fontWeight: "800" },
  locationMapScreen: { flex: 1, backgroundColor: "#fff" },
  locationMapHeader: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: Platform.OS === "android" ? 42 : 56, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#E8EEE7" },
  locationMapHeaderText: { flex: 1 },
  locationMapTitle: { color: "#1A2E1A", fontSize: 19, fontWeight: "800" },
  locationMapSubtitle: { color: "#718071", fontSize: 12, marginTop: 3 },
  locationMap: { flex: 1 },
  locationMapFooter: { padding: 16, paddingBottom: Platform.OS === "android" ? 28 : 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E8EEE7" },
  locationMapCoordinate: { color: "#718071", fontSize: 11, textAlign: "center", marginBottom: 10 },
  locationConfirmButton: { alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 14, backgroundColor: "#F4512A" },
  locationConfirmText: { color: "#fff", fontSize: 15, fontWeight: "800" },
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

