import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Plus, Edit2, Trash2, Folder, Layers } from 'lucide-react-native';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

interface Category {
    id: number;
    ten_danh_muc: string;
    mo_ta: string | null;
    ngay_tao: string;
    product_count: number;
}

export default function AdminCategoriesScreen({ onBack }: { onBack: () => void }) {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal Add / Edit
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/admin/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCategories(data.data || []);
            } else {
                Alert.alert("Lỗi", data.message || "Không thể tải danh mục");
            }
        } catch (error: any) {
            console.error("Lỗi fetch categories:", error);
            Alert.alert("Lỗi kết nối", "Không thể kết nối tới server Backend");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openAddModal = () => {
        setEditingCategory(null);
        setName('');
        setDescription('');
        setModalVisible(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.ten_danh_muc);
        setDescription(cat.mo_ta || '');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập tên danh mục!");
            return;
        }

        setSubmitting(true);
        try {
            const url = editingCategory 
                ? `${BASE_URL}/api/admin/categories/${editingCategory.id}`
                : `${BASE_URL}/api/admin/categories`;
            
            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ten_danh_muc: name.trim(),
                    mo_ta: description.trim() || null
                })
            });

            const data = await res.json();
            if (data.success) {
                Alert.alert("Thành công", data.message || "Đã lưu danh mục!");
                setModalVisible(false);
                fetchCategories();
            } else {
                Alert.alert("Lỗi", data.message || "Không thể lưu danh mục!");
            }
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể gửi dữ liệu đến server: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (cat: Category) => {
        if (cat.product_count > 0) {
            Alert.alert(
                "Không thể xóa",
                `Danh mục "${cat.ten_danh_muc}" hiện đang có ${cat.product_count} sản phẩm liên kết. Vui lòng chuyển các sản phẩm sang danh mục khác trước khi xóa!`
            );
            return;
        }

        Alert.alert(
            "Xác nhận xóa danh mục",
            `Bạn có chắc chắn muốn xóa danh mục "${cat.ten_danh_muc}" không? Hành động này không thể hoàn tác.`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await fetch(`${BASE_URL}/api/admin/categories/${cat.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.success) {
                                Alert.alert("Thành công", data.message || "Đã xóa danh mục!");
                                fetchCategories();
                            } else {
                                Alert.alert("Lỗi", data.message || "Không thể xóa danh mục");
                            }
                        } catch (error: any) {
                            Alert.alert("Lỗi", "Lỗi kết nối khi xóa: " + error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Category }) => (
        <View style={styles.catCard}>
            <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                    <Folder size={20} color="#2E7D32" style={{ marginRight: 8 }} />
                    <Text style={styles.catName}>{item.ten_danh_muc}</Text>
                </View>
                <View style={styles.badge}>
                    <Layers size={14} color="#1565C0" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeText}>{item.product_count} sản phẩm</Text>
                </View>
            </View>

            {item.mo_ta ? (
                <Text style={styles.catDesc} numberOfLines={2}>{item.mo_ta}</Text>
            ) : (
                <Text style={styles.noDesc}>Chưa có mô tả</Text>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                    Ngày tạo: {item.ngay_tao ? new Date(item.ngay_tao).toLocaleDateString('vi-VN') : '---'}
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={[styles.btnAction, styles.btnEdit]} 
                        onPress={() => openEditModal(item)}
                    >
                        <Edit2 size={16} color="#1565C0" />
                        <Text style={styles.btnEditText}>Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.btnAction, styles.btnDelete]} 
                        onPress={() => handleDelete(item)}
                    >
                        <Trash2 size={16} color="#D32F2F" />
                        <Text style={styles.btnDeleteText}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Danh mục</Text>
                <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
                    <Plus size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Đang tải danh mục...</Text>
                </View>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCategories(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Chưa có danh mục nào trong hệ thống.</Text>
                            <TouchableOpacity style={styles.createFirstBtn} onPress={openAddModal}>
                                <Text style={styles.createFirstBtnText}>+ Thêm danh mục đầu tiên</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Modal Add / Edit */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingCategory ? "Sửa Danh mục" : "Thêm Danh mục Mới"}
                        </Text>

                        <Text style={styles.inputLabel}>Tên danh mục (*)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ví dụ: Cây trong nhà, Sen đá..."
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.inputLabel}>Mô tả</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Mô tả về nhóm danh mục sản phẩm này..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.btnCancel]}
                                onPress={() => setModalVisible(false)}
                                disabled={submitting}
                            >
                                <Text style={styles.btnCancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.btnSave]}
                                onPress={handleSave}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.btnSaveText}>
                                        {editingCategory ? "Cập nhật" : "Tạo mới"}
                                    </Text>
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
        padding: 16,
        backgroundColor: '#2E7D32',
        paddingTop: 45
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    addBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 8
    },
    list: { padding: 16, paddingBottom: 40 },
    catCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    catName: { fontSize: 17, fontWeight: 'bold', color: '#1B5E20' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    badgeText: { fontSize: 12, color: '#1565C0', fontWeight: '600' },
    catDesc: { fontSize: 14, color: '#555', marginBottom: 12, lineHeight: 20 },
    noDesc: { fontSize: 13, color: '#999', fontStyle: 'italic', marginBottom: 12 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10
    },
    dateText: { fontSize: 12, color: '#888' },
    actions: { flexDirection: 'row', gap: 8 },
    btnAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    btnEdit: { backgroundColor: '#E3F2FD' },
    btnEditText: { color: '#1565C0', fontSize: 13, fontWeight: '600', marginLeft: 4 },
    btnDelete: { backgroundColor: '#FFEBEE' },
    btnDeleteText: { color: '#D32F2F', fontSize: 13, fontWeight: '600', marginLeft: 4 },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, color: '#777', marginBottom: 16 },
    createFirstBtn: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    createFirstBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        marginBottom: 16,
        backgroundColor: '#FAFAFA'
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    modalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center'
    },
    btnCancel: { backgroundColor: '#EEEEEE' },
    btnCancelText: { color: '#666', fontWeight: 'bold' },
    btnSave: { backgroundColor: '#2E7D32' },
    btnSaveText: { color: '#fff', fontWeight: 'bold' }
});
