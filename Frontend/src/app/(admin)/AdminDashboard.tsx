import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    ShoppingBag,
    ShoppingCart,
    DollarSign,
    Calendar,
    Target,
    LogOut,
    ArrowLeft,
    Folder,
    Tag,
    RefreshCw,
    TrendingUp,
    AlertCircle
} from 'lucide-react-native';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

export default function AdminDashboardScreen({
    onNavigate,
    onLogout
}: {
    onNavigate: (screen: string) => void;
    onLogout: () => void;
}) {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/admin_dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error("Lỗi tải thống kê Dashboard:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={{ marginTop: 10, color: '#666' }}>Đang tải số liệu hệ thống...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => onNavigate('profile')} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Hệ Thống Quản Trị</Text>
                        <Text style={styles.headerSubtitle}>Dữ liệu trực tiếp từ MySQL</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => { setLoading(true); loadStats(); }} style={styles.iconBtn}>
                        <RefreshCw size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLogout} style={[styles.iconBtn, { marginLeft: 8 }]}>
                        <LogOut size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Doanh thu Banner */}
            <View style={styles.revenueBanner}>
                <View style={styles.bannerHeader}>
                    <TrendingUp size={20} color="#2E7D32" />
                    <Text style={styles.bannerTitle}>Tổng quan doanh thu</Text>
                </View>
                <View style={styles.revenueRow}>
                    <View style={styles.revenueCol}>
                        <Text style={styles.revenueLabel}>Hôm nay</Text>
                        <Text style={styles.revenueValToday}>
                            {stats?.revenue?.today?.toLocaleString('vi-VN') || 0} đ
                        </Text>
                    </View>
                    <View style={styles.revenueDivider} />
                    <View style={styles.revenueCol}>
                        <Text style={styles.revenueLabel}>Tháng này</Text>
                        <Text style={styles.revenueVal}>
                            {stats?.revenue?.month?.toLocaleString('vi-VN') || 0} đ
                        </Text>
                    </View>
                    <View style={styles.revenueDivider} />
                    <View style={styles.revenueCol}>
                        <Text style={styles.revenueLabel}>Tổng tích lũy</Text>
                        <Text style={styles.revenueVal}>
                            {stats?.revenue?.total?.toLocaleString('vi-VN') || 0} đ
                        </Text>
                    </View>
                </View>
            </View>

            {/* Cảnh báo tồn kho nếu có */}
            {stats?.products?.low_stock > 0 && (
                <TouchableOpacity 
                    style={styles.alertCard} 
                    onPress={() => onNavigate('adminProducts')}
                >
                    <AlertCircle size={20} color="#E65100" />
                    <Text style={styles.alertText}>
                        Có <Text style={{ fontWeight: 'bold' }}>{stats.products.low_stock} sản phẩm</Text> sắp hết hàng (tồn ≤ 5).
                    </Text>
                </TouchableOpacity>
            )}

            {/* Grid Chức năng Quản lý */}
            <Text style={styles.sectionTitle}>Các Phân Hệ Quản Trị</Text>
            <View style={styles.grid}>
                {/* 1. Người dùng */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminUsers')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                        <Users size={26} color="#1976D2" />
                    </View>
                    <Text style={styles.cardTitle}>Người dùng</Text>
                    <Text style={styles.cardValue}>{stats?.users?.total || 0}</Text>
                    <Text style={styles.cardSub}>Đang hoạt động: {stats?.users?.active || 0}</Text>
                </TouchableOpacity>

                {/* 2. Sản phẩm */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminProducts')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                        <ShoppingBag size={26} color="#F57C00" />
                    </View>
                    <Text style={styles.cardTitle}>Sản phẩm</Text>
                    <Text style={styles.cardValue}>{stats?.products?.total || 0}</Text>
                    <Text style={styles.cardSub}>Đang bán: {stats?.products?.active || 0}</Text>
                </TouchableOpacity>

                {/* 3. Danh mục */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminCategories')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                        <Folder size={26} color="#2E7D32" />
                    </View>
                    <Text style={styles.cardTitle}>Danh mục</Text>
                    <Text style={styles.cardValue}>{stats?.products?.categories || 0}</Text>
                    <Text style={styles.cardSub}>Nhóm phân loại</Text>
                </TouchableOpacity>

                {/* 4. Đơn hàng */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminOrders')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                        <ShoppingCart size={26} color="#7B1FA2" />
                    </View>
                    <Text style={styles.cardTitle}>Đơn hàng</Text>
                    <Text style={styles.cardValue}>{stats?.orders?.total || 0}</Text>
                    <Text style={[styles.cardSub, { color: '#D32F2F', fontWeight: 'bold' }]}>
                        Chờ duyệt: {stats?.orders?.pending || 0}
                    </Text>
                </TouchableOpacity>

                {/* 5. Mã giảm giá */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminVouchers')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FCE4EC' }]}>
                        <Tag size={26} color="#C2185B" />
                    </View>
                    <Text style={styles.cardTitle}>Mã giảm giá</Text>
                    <Text style={styles.cardValue}>{stats?.vouchers?.total || 0}</Text>
                    <Text style={styles.cardSub}>Khả dụng: {stats?.vouchers?.available || 0}</Text>
                </TouchableOpacity>

                {/* 6. Thống kê Sự kiện Cây ảo */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminEvents')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                        <Calendar size={26} color="#00796B" />
                    </View>
                    <Text style={styles.cardTitle}>Cây Ảo</Text>
                    <Text style={styles.cardValue}>{stats?.events?.participants || 0}</Text>
                    <Text style={styles.cardSub}>Người tham gia</Text>
                </TouchableOpacity>

                {/* 7. Nhiệm vụ Hàng ngày */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminQuests')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
                        <Target size={26} color="#512DA8" />
                    </View>
                    <Text style={styles.cardTitle}>Nhiệm vụ Ngày</Text>
                    <Text style={styles.cardValue}>4</Text>
                    <Text style={styles.cardSub}>Tương tác tương ứng</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#2E7D32',
        paddingTop: 45
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },

    revenueBanner: {
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3
    },
    bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    bannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    revenueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    revenueCol: { flex: 1, alignItems: 'center' },
    revenueDivider: { width: 1, height: 35, backgroundColor: '#eee' },
    revenueLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
    revenueValToday: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32' },
    revenueVal: { fontSize: 14, fontWeight: '600', color: '#333' },

    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        gap: 8
    },
    alertText: { fontSize: 13, color: '#E65100', flex: 1 },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 10
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, justifyContent: 'space-between' },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    cardTitle: { fontSize: 14, color: '#555', fontWeight: '600' },
    cardValue: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 4 },
    cardSub: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' }
});
