import React, { useEffect, useState, useRef } from 'react';
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
  RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Search, Plus, Edit2, Trash2, Lock, Unlock, Shield, User, Phone, Mail, X, RefreshCw } from 'lucide-react-native';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";
const ADMIN_REFRESH_INTERVAL_MS = 45 * 1000; // Tự làm mới 45 giây

interface UserItem {
  id: number;
  ten_dang_nhap: string;
  email: string;
  ho_ten: string | null;
  so_dien_thoai: string | null;
  dia_chi?: string | null;
  vai_tro: string;
  dang_hoat_dong: number | boolean;
  ngay_tao: string;
  last_seen: string | null;  // Thời gian hoạt động cuối (từ server)
  online: boolean;           // Backend tính từ last_seen (INTERVAL 2 MINUTE)
}

export default function AdminUsersScreen({ onBack }: { onBack: () => void }) {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlineFilter, setOnlineFilter] = useState<string>('all'); // 'all' | 'online' | 'offline'
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal Thêm / Sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'khach_hang' | 'admin'>('khach_hang');

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Gọi trực tiếp /api/admin/users — trả về last_seen và online đã tính từ backend
      const res = await fetch(
        `${BASE_URL}/api/admin/users?search=${encodeURIComponent(search)}&limit=100`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách user:", err);
      if (!silent) Alert.alert("Lỗi", "Không thể lấy danh sách người dùng.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tải lần đầu và thiết lập tự làm mới 45 giây
  useEffect(() => {
    fetchUsers();
    autoRefreshRef.current = setInterval(() => fetchUsers(true), ADMIN_REFRESH_INTERVAL_MS);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []);

  const handleSearch = () => {
    fetchUsers();
  };

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setRole('khach_hang');
    setModalVisible(true);
  };

  const openEditModal = (item: UserItem) => {
    setEditingUser(item);
    setUsername(item.ten_dang_nhap || '');
    setPassword('');
    setFullName(item.ho_ten || '');
    setEmail(item.email || '');
    setPhone(item.so_dien_thoai || '');
    setAddress(item.dia_chi || '');
    setRole(item.vai_tro === 'admin' ? 'admin' : 'khach_hang');
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) {
      if (!username.trim() || !password.trim() || !email.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập Tên đăng nhập, Mật khẩu và Email!");
        return;
      }
    } else {
      if (!email.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập Email!");
        return;
      }
    }

    setSaving(true);
    try {
      if (editingUser) {
        // Cập nhật người dùng
        const payload = {
          ho_ten: fullName.trim(),
          name: fullName.trim(),
          email: email.trim(),
          so_dien_thoai: phone.trim(),
          phone: phone.trim(),
          dia_chi: address.trim(),
          address: address.trim(),
          vai_tro: role,
          mat_khau: password.trim() || undefined
        };

        const res = await fetch(`${BASE_URL}/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        Alert.alert("Thành công", data.message || "Đã cập nhật người dùng!");
        setModalVisible(false);
        fetchUsers();
      } else {
        // Thêm người dùng mới
        const payload = {
          ten_dang_nhap: username.trim(),
          mat_khau: password.trim(),
          email: email.trim(),
          ho_ten: fullName.trim() || null,
          so_dien_thoai: phone.trim() || null,
          dia_chi: address.trim() || null,
          vai_tro: role,
          dang_hoat_dong: 1
        };

        const res = await fetch(`${BASE_URL}/api/admin/users/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success || data.id) {
          Alert.alert("Thành công", "Đã thêm người dùng mới thành công!");
          setModalVisible(false);
          fetchUsers();
        } else {
          Alert.alert("Thông báo", data.message || "Không thể thêm người dùng.");
        }
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi lưu người dùng.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (item: UserItem) => {
    if (item.id === 1) {
      Alert.alert("Thông báo", "Không thể khóa tài khoản Quản trị viên gốc!");
      return;
    }

    const isCurrentActive = item.dang_hoat_dong === 1 || item.dang_hoat_dong === true;
    const actionName = isCurrentActive ? "khóa" : "mở khóa";

    Alert.alert(
      `Xác nhận ${actionName}`,
      `Bạn có chắc chắn muốn ${actionName} tài khoản "${item.ten_dang_nhap || item.ho_ten}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: isCurrentActive ? "Khóa" : "Mở khóa",
          style: isCurrentActive ? "destructive" : "default",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/admin/users/${item.id}/toggle-status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert("Thành công", `Đã ${actionName} tài khoản thành công!`);
                fetchUsers();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái.");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (item: UserItem) => {
    if (item.id === 1) {
      Alert.alert("Thông báo", "Không thể xóa tài khoản Quản trị viên gốc!");
      return;
    }

    Alert.alert(
      "Xác nhận xóa tài khoản",
      `Bạn có chắc chắn muốn xóa vĩnh viễn người dùng "${item.ho_ten || item.ten_dang_nhap}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/admin/users/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert("Thành công", "Đã xóa người dùng thành công!");
                fetchUsers();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể xóa người dùng.");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể xóa người dùng.");
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase().trim();
    const matchSearch =
      !term ||
      (u.ho_ten && u.ho_ten.toLowerCase().includes(term)) ||
      (u.ten_dang_nhap && u.ten_dang_nhap.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.so_dien_thoai && u.so_dien_thoai.includes(term));

    const matchRole = roleFilter === 'all' || u.vai_tro === roleFilter;
    const isActive = u.dang_hoat_dong === 1 || u.dang_hoat_dong === true;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    const matchOnline =
      onlineFilter === 'all' ||
      (onlineFilter === 'online' && u.online === true) ||
      (onlineFilter === 'offline' && u.online === false);

    return matchSearch && matchRole && matchStatus && matchOnline;
  });

  // Helper: Format last_seen thành chuỗi thân thiện
  const formatLastSeen = (lastSeen: string | null): string => {
    if (!lastSeen) return 'Chưa có hoạt động';
    const d = new Date(lastSeen);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffMin < 1440) {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return `${h} giờ${m > 0 ? ` ${m} phút` : ''} trước`;
    }
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const renderItem = ({ item }: { item: UserItem }) => {
    const isActive = item.dang_hoat_dong === 1 || item.dang_hoat_dong === true;
    const isAdmin = item.vai_tro === 'admin';
    const isOnline = item.online === true;

    return (
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: isOnline ? '#4CAF50' : '#E0E0E0' }]}>
        {/* Header: Avatar + Tên + Badges */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, isAdmin ? styles.avatarAdmin : styles.avatarUser]}>
              {isAdmin ? <Shield size={20} color="#fff" /> : <User size={20} color="#fff" />}
            </View>
            {/* Online dot trên avatar */}
            <View style={[
              styles.avatarOnlineDot,
              { backgroundColor: isOnline ? '#4CAF50' : '#BDBDBD', borderColor: '#fff' }
            ]} />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {item.ho_ten || item.ten_dang_nhap || 'Người dùng'}
            </Text>
            <Text style={styles.userSubText}>ID: #{item.id} • @{item.ten_dang_nhap}</Text>
          </View>

          {/* Badges bên phải */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {/* Badge Tài khoản */}
            <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={isActive ? styles.badgeTextActive : styles.badgeTextInactive}>
                {isActive ? '✓ Hoạt động' : '🔒 Bị khóa'}
              </Text>
            </View>
            {/* Badge Online */}
            <View style={[styles.onlineBadge, isOnline ? styles.onlineBadgeOnline : styles.onlineBadgeOffline]}>
              <View style={[styles.onlineDotSmall, { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' }]} />
              <Text style={[styles.onlineBadgeText, { color: isOnline ? '#1B5E20' : '#757575' }]}>
                {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chi tiết */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Mail size={13} color="#888" />
            <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
          </View>
          {item.so_dien_thoai && (
            <View style={styles.detailRow}>
              <Phone size={13} color="#888" />
              <Text style={styles.detailText}>{item.so_dien_thoai}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Shield size={13} color="#888" />
            <Text style={styles.detailText}>
              Vai trò:{' '}
              <Text style={{ fontWeight: '700', color: isAdmin ? '#C62828' : '#2E7D32' }}>
                {isAdmin ? 'Quản trị viên' : 'Khách hàng'}
              </Text>
            </Text>
          </View>

          {/* Thời gian hoạt động cuối */}
          {!isOnline && (
            <View style={styles.detailRow}>
              <View style={[styles.onlineDotSmall, { backgroundColor: '#BDBDBD' }]} />
              <Text style={styles.lastSeenText}>
                Ngoại tuyến · {formatLastSeen(item.last_seen)}
              </Text>
            </View>
          )}
          {isOnline && (
            <View style={styles.detailRow}>
              <View style={[styles.onlineDotSmall, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.lastSeenText, { color: '#2E7D32', fontWeight: '600' }]}>
                Đang trực tuyến
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          {/* Nút Khóa / Mở khóa */}
          <TouchableOpacity
            style={[styles.actionBtn, isActive ? styles.btnLock : styles.btnUnlock]}
            onPress={() => handleToggleStatus(item)}
          >
            {isActive ? <Lock size={14} color="#E65100" /> : <Unlock size={14} color="#2E7D32" />}
            <Text style={[styles.actionBtnText, { color: isActive ? '#E65100' : '#2E7D32' }]}>
              {isActive ? 'Khóa' : 'Mở khóa'}
            </Text>
          </TouchableOpacity>

          {/* Nút Sửa */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnEdit]}
            onPress={() => openEditModal(item)}
          >
            <Edit2 size={14} color="#1565C0" />
            <Text style={[styles.actionBtnText, { color: '#1565C0' }]}>Sửa</Text>
          </TouchableOpacity>

          {/* Nút Xóa */}
          {item.id !== 1 && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnDelete]}
              onPress={() => handleDeleteUser(item)}
            >
              <Trash2 size={14} color="#D32F2F" />
              <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý Người dùng</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconHeaderBtn} onPress={() => fetchUsers()}>
            <RefreshCw size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên, email, sđt, tài khoản..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Search size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Vai trò */}
          <TouchableOpacity style={[styles.chip, roleFilter === 'all' && styles.chipActive]} onPress={() => setRoleFilter('all')}>
            <Text style={[styles.chipText, roleFilter === 'all' && styles.chipTextActive]}>Tất cả vai trò</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, roleFilter === 'khach_hang' && styles.chipActive]} onPress={() => setRoleFilter('khach_hang')}>
            <Text style={[styles.chipText, roleFilter === 'khach_hang' && styles.chipTextActive]}>Khách hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, roleFilter === 'admin' && styles.chipActive]} onPress={() => setRoleFilter('admin')}>
            <Text style={[styles.chipText, roleFilter === 'admin' && styles.chipTextActive]}>Quản trị viên</Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Trạng thái tài khoản */}
          <TouchableOpacity style={[styles.chip, statusFilter === 'active' && styles.chipActive]} onPress={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}>
            <Text style={[styles.chipText, statusFilter === 'active' && styles.chipTextActive]}>Tài khoản hoạt động</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, statusFilter === 'inactive' && styles.chipInactiveBg]} onPress={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
          >
            <Text style={[styles.chipText, statusFilter === 'inactive' && { color: '#fff' }]}>Bị khóa</Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Trạng thái Online */}
          <TouchableOpacity style={[styles.chip, onlineFilter === 'online' && styles.chipOnlineBg]} onPress={() => setOnlineFilter(onlineFilter === 'online' ? 'all' : 'online')}>
            <Text style={[styles.chipText, onlineFilter === 'online' && { color: '#fff' }]}>🟢 Trực tuyến</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, onlineFilter === 'offline' && styles.chipActive]} onPress={() => setOnlineFilter(onlineFilter === 'offline' ? 'all' : 'offline')}>
            <Text style={[styles.chipText, onlineFilter === 'offline' && styles.chipTextActive]}>⚫ Ngoại tuyến</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /></View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />
          }
          ListHeaderComponent={
            <Text style={styles.totalCount}>
              Hiển thị {filteredUsers.length}/{users.length} người dùng
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
            </View>
          }
        />
      )}

      {/* Modal Thêm / Chỉnh sửa User */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? `Chỉnh sửa: ${editingUser.ten_dang_nhap}` : "Thêm người dùng mới"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <X size={22} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {!editingUser && (
                <>
                  <Text style={styles.inputLabel}>Tên đăng nhập (Username) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="VD: nguyenvana"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>
                {editingUser ? "Mật khẩu mới (Bỏ trống nếu không đổi)" : "Mật khẩu *"}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập mật khẩu..."
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Nguyễn Văn A"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: 0987654321"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>Địa chỉ</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                value={address}
                onChangeText={setAddress}
              />

              <Text style={styles.inputLabel}>Vai trò hệ thống</Text>
              <View style={styles.roleGroup}>
                <TouchableOpacity
                  style={[styles.roleOption, role === 'khach_hang' && styles.roleOptionActive]}
                  onPress={() => setRole('khach_hang')}
                >
                  <Text style={[styles.roleOptionText, role === 'khach_hang' && styles.roleOptionTextActive]}>
                    Khách hàng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, role === 'admin' && styles.roleOptionActiveAdmin]}
                  onPress={() => setRole('admin')}
                >
                  <Text style={[styles.roleOptionText, role === 'admin' && styles.roleOptionTextActiveAdmin]}>
                    Quản trị viên (Admin)
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSaveUser}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>Lưu thông tin</Text>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2E7D32',
    paddingTop: 45
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B5E20',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#FAFAFA'
  },
  searchBtn: {
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 8
  },
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8
  },
  filterScroll: { paddingHorizontal: 10, gap: 8, alignItems: 'center' },
  filterDivider: { width: 1, height: 20, backgroundColor: '#ddd', marginHorizontal: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F0F0F0'
  },
  chipActive: { backgroundColor: '#2E7D32' },
  chipInactiveBg: { backgroundColor: '#D32F2F' },
  chipOnlineBg: { backgroundColor: '#4CAF50' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  avatarWrapper: { position: 'relative', width: 42, height: 42 },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarAdmin: { backgroundColor: '#C62828' },
  avatarUser: { backgroundColor: '#2E7D32' },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2
  },
  userNameText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  userSubText: { fontSize: 12, color: '#888', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeActive: { backgroundColor: '#E8F5E9' },
  badgeInactive: { backgroundColor: '#FFEBEE' },
  badgeTextActive: { color: '#2E7D32', fontSize: 10, fontWeight: '700' },
  badgeTextInactive: { color: '#C62828', fontSize: 10, fontWeight: '700' },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  onlineBadgeOnline: { backgroundColor: '#E8F5E9' },
  onlineBadgeOffline: { backgroundColor: '#F5F5F5' },
  onlineDotSmall: { width: 7, height: 7, borderRadius: 4 },
  onlineBadgeText: { fontSize: 10, fontWeight: '700' },
  cardDetails: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F2F2',
    gap: 6
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#555', flex: 1 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: { width: 9, height: 9, borderRadius: 5 },
  onlineText: { fontSize: 13, fontWeight: '700' },
  lastSeenText: { fontSize: 12, color: '#999' },
  totalCount: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 6 },
  iconHeaderBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  btnLock: { backgroundColor: '#FFF3E0' },
  btnUnlock: { backgroundColor: '#E8F5E9' },
  btnEdit: { backgroundColor: '#E3F2FD' },
  btnDelete: { backgroundColor: '#FFEBEE' },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', fontSize: 15 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '85%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
    backgroundColor: '#FAFAFA'
  },
  roleGroup: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#F9F9F9'
  },
  roleOptionActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  roleOptionActiveAdmin: { borderColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  roleOptionText: { fontSize: 13, color: '#555', fontWeight: '500' },
  roleOptionTextActive: { color: '#2E7D32', fontWeight: 'bold' },
  roleOptionTextActiveAdmin: { color: '#D32F2F', fontWeight: 'bold' },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    gap: 12
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    alignItems: 'center'
  },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});
