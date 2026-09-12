import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { ArrowLeft, Search, Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { resolveProductImage } from '../../assets/productImages';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

interface ProductItem {
  id: number;
  ten_san_pham: string;
  mo_ta?: string | null;
  gia_tien: number;
  so_luong_kho: number;
  category_id?: number | null;
  category_name?: string;
  hinh_anh_url?: string | null;
  dang_kinh_doanh: number | boolean;
}

interface CategoryItem {
  id: number;
  ten_danh_muc: string;
}

export default function AdminProductsScreen({ onBack }: { onBack: () => void }) {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/categories`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
    }
  };

  // Fetch Products
  const fetchProducts = async (term = search, catId = selectedCategory) => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/adminproducts?`;
      const params = new URLSearchParams();
      if (term.trim()) params.append('search', term.trim());
      if (catId !== null) params.append('category_id', catId.toString());

      const res = await fetch(`${url}${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Lỗi lấy sản phẩm:", err);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts('', null);
  }, []);

  const handleSearch = () => {
    fetchProducts(search, selectedCategory);
  };

  const handleSelectCategory = (id: number | null) => {
    setSelectedCategory(id);
    fetchProducts(search, id);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategoryId(categories.length > 0 ? categories[0].id : null);
    setImageUrl('');
    setIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (item: ProductItem) => {
    setEditingProduct(item);
    setName(item.ten_san_pham);
    setDescription(item.mo_ta || '');
    setPrice(item.gia_tien ? item.gia_tien.toString() : '0');
    setStock(item.so_luong_kho !== undefined ? item.so_luong_kho.toString() : '0');
    setCategoryId(item.category_id || (categories.length > 0 ? categories[0].id : null));
    setImageUrl(item.hinh_anh_url || '');
    setIsActive(item.dang_kinh_doanh === 1 || item.dang_kinh_doanh === true);
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên sản phẩm.");
      return;
    }
    const numPrice = parseFloat(price) || 0;
    const numStock = parseInt(stock) || 0;

    setSaving(true);
    try {
      const payload = {
        ten_san_pham: name.trim(),
        mo_ta: description.trim() || null,
        gia_tien: numPrice,
        so_luong_kho: numStock,
        category_id: categoryId,
        hinh_anh_url: imageUrl.trim() || null,
        dang_kinh_doanh: isActive
      };

      let res;
      if (editingProduct) {
        res = await fetch(`${BASE_URL}/adminproducts/admin/update/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${BASE_URL}/adminproducts/admin/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();
      if (result.success) {
        Alert.alert("Thành công", editingProduct ? "Đã cập nhật sản phẩm!" : "Đã thêm sản phẩm mới!");
        setModalVisible(false);
        fetchProducts(search, selectedCategory);
      } else {
        Alert.alert("Lỗi", result.message || "Không thể lưu sản phẩm.");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductStatus = async (item: ProductItem) => {
    try {
      const res = await fetch(`${BASE_URL}/adminproducts/admin/toggle-status/${item.id}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts(search, selectedCategory);
      } else {
        Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = (id: number, name: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa sản phẩm "${name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/adminproducts/admin/delete/${id}`, {
                method: 'DELETE'
              });
              const result = await res.json();
              if (result.success) {
                Alert.alert("Thành công", "Đã xóa sản phẩm thành công!");
                fetchProducts(search, selectedCategory);
              } else {
                Alert.alert("Lỗi", result.message || "Không thể xóa sản phẩm.");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm.");
            }
          }
        }
      ]
    );
  };

  const renderProductItem = ({ item }: { item: ProductItem }) => {
    const isAvailable = item.dang_kinh_doanh === 1 || item.dang_kinh_doanh === true;
    return (
      <View style={styles.card}>
        <Image
          source={resolveProductImage(item.hinh_anh_url)}
          style={styles.productImg}
        />
        <View style={styles.productInfo}>
          <View style={styles.rowBetween}>
            <Text style={styles.productName} numberOfLines={2}>{item.ten_san_pham}</Text>
            <TouchableOpacity
              onPress={() => handleToggleProductStatus(item)}
              style={[styles.badge, isAvailable ? styles.badgeActive : styles.badgeInactive]}
            >
              <Text style={isAvailable ? styles.badgeTextActive : styles.badgeTextInactive}>
                {isAvailable ? "Đang bán" : "Tạm ngưng"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.categoryText}>
            Danh mục: {item.category_name || "Chưa phân loại"}
          </Text>

          {item.mo_ta ? (
            <Text style={styles.descText} numberOfLines={1}>
              {item.mo_ta}
            </Text>
          ) : null}

          <View style={styles.rowBetween}>
            <Text style={styles.priceText}>
              {Number(item.gia_tien || 0).toLocaleString('vi-VN')} đ
            </Text>
            <Text style={[styles.stockText, item.so_luong_kho <= 5 && styles.lowStock]}>
              Kho: {item.so_luong_kho}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
              <Edit2 size={16} color="#1976D2" />
              <Text style={styles.editBtnText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item.id, item.ten_san_pham)}>
              <Trash2 size={16} color="#D32F2F" />
              <Text style={styles.deleteBtnText}>Xóa</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.headerTitle}>Quản lý Sản phẩm</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên sản phẩm..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Search size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === null && styles.catChipActive]}
            onPress={() => handleSelectCategory(null)}
          >
            <Text style={[styles.catChipText, selectedCategory === null && styles.catChipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
              onPress={() => handleSelectCategory(cat.id)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
                {cat.ten_danh_muc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={22} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tên sản phẩm *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Cây Trầu Bà Đế Vương"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Mô tả sản phẩm</Text>
              <TextInput
                style={[styles.input, { height: 68, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="VD: Cây lọc không khí tốt, ưa bóng râm, tưới 1-2 lần/tuần..."
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Giá tiền (VNĐ) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: 150000"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>Số lượng kho *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: 20"
                    keyboardType="numeric"
                    value={stock}
                    onChangeText={setStock}
                  />
                </View>
              </View>

              <Text style={styles.label}>Danh mục sản phẩm</Text>
              <View style={styles.catSelectGroup}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catSelectChip, categoryId === cat.id && styles.catSelectChipActive]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={[styles.catSelectChipText, categoryId === cat.id && styles.catSelectChipTextActive]}>
                      {cat.ten_danh_muc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Đường dẫn ảnh (URL hoặc đường dẫn tương đối)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: images/cactus.jpg hoặc https://..."
                value={imageUrl}
                onChangeText={setImageUrl}
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Kinh doanh (hiển thị cho khách mua)</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: "#ccc", true: "#A5D6A7" }}
                  thumbColor={isActive ? "#2E7D32" : "#f4f3f4"}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu sản phẩm</Text>
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
  categoryScrollContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8
  },
  categoryScroll: { paddingHorizontal: 10, gap: 8 },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F0F0F0'
  },
  catChipActive: { backgroundColor: '#2E7D32' },
  catChipText: { fontSize: 13, color: '#555' },
  catChipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }
  },
  productImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 12
  },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#222', flex: 1, marginRight: 6 },
  categoryText: { fontSize: 12, color: '#777', marginVertical: 2 },
  descText: { fontSize: 12, color: '#888', marginBottom: 4 },
  priceText: { fontSize: 15, fontWeight: '700', color: '#D32F2F' },
  stockText: { fontSize: 13, color: '#555' },
  lowStock: { color: '#E65100', fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeActive: { backgroundColor: '#E8F5E9' },
  badgeInactive: { backgroundColor: '#FFEBEE' },
  badgeTextActive: { color: '#2E7D32', fontSize: 11, fontWeight: '600' },
  badgeTextInactive: { color: '#C62828', fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4
  },
  editBtnText: { color: '#1976D2', fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4
  },
  deleteBtnText: { color: '#D32F2F', fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', fontSize: 15 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16
  },
  modalContent: {
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
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    backgroundColor: '#FAFAFA'
  },
  rowInputs: { flexDirection: 'row' },
  catSelectGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  catSelectChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#F9F9F9'
  },
  catSelectChipActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9'
  },
  catSelectChipText: { fontSize: 12, color: '#555' },
  catSelectChipTextActive: { color: '#2E7D32', fontWeight: 'bold' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    alignItems: 'center'
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});
