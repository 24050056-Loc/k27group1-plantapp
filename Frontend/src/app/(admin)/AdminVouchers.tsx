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
import { ArrowLeft, Plus, Tag, CheckCircle, Clock, Sparkles } from 'lucide-react-native';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

interface GeneralCoupon {
    id: number;
    ma_code: string;
    loai_giam_gia: 'phan_tram' | 'so_tien_co_dinh';
    gia_tri_giam: number;
    dang_ap_dung: number;
}

interface UserCoupon {
    id: number;
    user_id: number;
    code: string;
    label: string | null;
    description: string | null;
    discount_type: string;
    discount_value: number;
    source_stage: number | null;
    status: string;
    created_at: string;
    expires_at: string | null;
    used_at: string | null;
    ho_ten: string | null;
    email: string | null;
}

export default function AdminVouchersScreen({ onBack }: { onBack: () => void }) {
    const { token } = useAuth();
    const [generalCoupons, setGeneralCoupons] = useState<GeneralCoupon[]>([]);
    const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'user'>('general');

    // Modal Create Coupon
    const [modalVisible, setModalVisible] = useState(false);
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'so_tien_co_dinh' | 'phan_tram'>('so_tien_co_dinh');
    const [discountValue, setDiscountValue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchVouchers = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/admin/vouchers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGeneralCoupons(data.data?.general || []);
                setUserCoupons(data.data?.user_coupons || []);
            } else {
                Alert.alert("Lỗi", data.message || "Không thể tải danh sách voucher");
            }
        } catch (error: any) {
            console.error("Lỗi fetch vouchers:", error);
            Alert.alert("Lỗi kết nối", "Không thể kết nối tới server Backend");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleCreateCoupon = async () => {
        if (!code.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập mã giảm giá (Mã code)!");
            return;
        }

        const val = parseFloat(discountValue);
        if (isNaN(val) || val <= 0) {
            Alert.alert("Thông báo", "Giá trị giảm phải lớn hơn 0!");
            return;
        }

        if (discountType === 'phan_tram' && val > 100) {
            Alert.alert("Thông báo", "Phần trăm giảm không được vượt quá 100%!");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/vouchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ma_code: code.trim().toUpperCase(),
                    loai_giam_gia: discountType,
                    gia_tri_giam: val
                })
            });

            const data = await res.json();
            if (data.success) {
                Alert.alert("Thành công", data.message || "Tạo mã giảm giá mới thành công!");
                setModalVisible(false);
                setCode('');
                setDiscountValue('');
                fetchVouchers();
            } else {
                Alert.alert("Lỗi", data.message || "Không thể tạo mã giảm giá!");
            }
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể kết nối đến máy chủ: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderGeneralCoupon = ({ item }: { item: GeneralCoupon }) => (
        <View style={styles.couponCard}>
            <View style={styles.cardHeader}>
                <View style={styles.badgeCode}>
                    <Tag size={16} color="#2E7D32" style={{ marginRight: 6 }} />
                    <Text style={styles.codeText}>{item.ma_code}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.dang_ap_dung ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.statusText, { color: item.dang_ap_dung ? '#2E7D32' : '#D32F2F' }]}>
                        {item.dang_ap_dung ? "Đang áp dụng" : "Ngưng dùng"}
                    </Text>
                </View>
            </View>

            <View style={styles.couponBody}>
                <Text style={styles.discountHighlight}>
                    Giảm: {item.loai_giam_gia === 'phan_tram' 
                        ? `${item.gia_tri_giam}%` 
                        : `${Number(item.gia_tri_giam).toLocaleString('vi-VN')} đ`}
                </Text>
                <Text style={styles.typeText}>
                    Loại: {item.loai_giam_gia === 'phan_tram' ? "Theo tỷ lệ phần trăm" : "Khấu trừ tiền cố định"}
                </Text>
            </View>
        </View>
    );

    const renderUserCoupon = ({ item }: { item: UserCoupon }) => (
        <View style={styles.couponCard}>
            <View style={styles.cardHeader}>
                <View style={styles.badgeCode}>
                    <Sparkles size={16} color="#8E24AA" style={{ marginRight: 6 }} />
                    <Text style={[styles.codeText, { color: '#8E24AA' }]}>{item.code}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'used' ? '#E0E0E0' : '#E8F5E9' }]}>
                    {item.status === 'used' ? (
                        <CheckCircle size={14} color="#757575" style={{ marginRight: 4 }} />
                    ) : (
                        <Clock size={14} color="#2E7D32" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.statusText, { color: item.status === 'used' ? '#757575' : '#2E7D32' }]}>
                        {item.status === 'used' ? "Đã dùng" : "Khả dụng"}
                    </Text>
                </View>
            </View>

            <View style={styles.couponBody}>
                <Text style={styles.userCouponOwner}>
                    Người sở hữu: <Text style={{ fontWeight: 'bold' }}>{item.ho_ten || `User #${item.user_id}`}</Text>
                </Text>
                {item.label && <Text style={styles.couponLabel}>{item.label}</Text>}
                <Text style={styles.discountHighlight}>
                    Giảm: {Number(item.discount_value).toLocaleString('vi-VN')} đ
                </Text>
                {item.source_stage && (
                    <Text style={styles.sourceStage}>Từ sự kiện trồng cây - Mốc #{item.source_stage}</Text>
                )}
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
                <Text style={styles.headerTitle}>Quản lý Mã Giảm Giá</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                    <Plus size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'general' && styles.activeTabBtn]}
                    onPress={() => setActiveTab('general')}
                >
                    <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
                        Mã công khai ({generalCoupons.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'user' && styles.activeTabBtn]}
                    onPress={() => setActiveTab('user')}
                >
                    <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>
                        Voucher Cây Ảo ({userCoupons.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Đang tải danh sách voucher...</Text>
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'general' ? generalCoupons : userCoupons}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={activeTab === 'general' ? (renderGeneralCoupon as any) : (renderUserCoupon as any)}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVouchers(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Chưa có voucher nào trong danh mục này.</Text>
                        </View>
                    }
                />
            )}

            {/* Modal Create Voucher */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tạo Mã Giảm Giá Mới</Text>

                        <Text style={styles.inputLabel}>Mã giảm giá (Code) (*)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ví dụ: SALE50K, TET2026..."
                            value={code}
                            onChangeText={(t) => setCode(t.toUpperCase())}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.inputLabel}>Loại giảm giá</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeOption, discountType === 'so_tien_co_dinh' && styles.typeOptionActive]}
                                onPress={() => setDiscountType('so_tien_co_dinh')}
                            >
                                <Text style={[styles.typeOptionText, discountType === 'so_tien_co_dinh' && styles.typeOptionTextActive]}>
                                    Số tiền cố định (VNĐ)
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeOption, discountType === 'phan_tram' && styles.typeOptionActive]}
                                onPress={() => setDiscountType('phan_tram')}
                            >
                                <Text style={[styles.typeOptionText, discountType === 'phan_tram' && styles.typeOptionTextActive]}>
                                    Phần trăm (%)
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>
                            {discountType === 'so_tien_co_dinh' ? "Số tiền giảm (VNĐ) (*)" : "Tỷ lệ giảm (%) (*)"}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={discountType === 'so_tien_co_dinh' ? "Ví dụ: 30000" : "Ví dụ: 15"}
                            keyboardType="numeric"
                            value={discountValue}
                            onChangeText={setDiscountValue}
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
                                onPress={handleCreateCoupon}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.btnSaveText}>Tạo Voucher</Text>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent'
    },
    activeTabBtn: {
        borderBottomColor: '#2E7D32'
    },
    tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
    activeTabText: { color: '#2E7D32', fontWeight: 'bold' },
    list: { padding: 16, paddingBottom: 40 },
    couponCard: {
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
        marginBottom: 10
    },
    badgeCode: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F8E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#C8E6C9'
    },
    codeText: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32', letterSpacing: 1 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: { fontSize: 12, fontWeight: '600' },
    couponBody: { marginTop: 4 },
    discountHighlight: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F', marginBottom: 4 },
    typeText: { fontSize: 13, color: '#666' },
    userCouponOwner: { fontSize: 14, color: '#333', marginBottom: 2 },
    couponLabel: { fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 4 },
    sourceStage: { fontSize: 12, color: '#8E24AA', marginTop: 4 },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, color: '#777' },

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
    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    typeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fafafa'
    },
    typeOptionActive: {
        borderColor: '#2E7D32',
        backgroundColor: '#E8F5E9'
    },
    typeOptionText: { fontSize: 13, color: '#555' },
    typeOptionTextActive: { color: '#2E7D32', fontWeight: 'bold' },

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
