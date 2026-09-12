import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Users, ShoppingBag, ShoppingCart, DollarSign, Calendar, Target, LogOut, ArrowLeft } from 'lucide-react-native';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

export default function AdminDashboardScreen({ onNavigate, onLogout }: { onNavigate: (screen: string) => void, onLogout: () => void }) {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${BASE_URL}/api/admin_dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) setStats(data.data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => onNavigate('profile')} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
                <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                    <LogOut size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminUsers')}>
                    <Users size={32} color="#4A90E2" />
                    <Text style={styles.cardTitle}>Người dùng</Text>
                    <Text style={styles.cardValue}>{stats?.users?.total || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminProducts')}>
                    <ShoppingBag size={32} color="#F5A623" />
                    <Text style={styles.cardTitle}>Sản phẩm</Text>
                    <Text style={styles.cardValue}>{stats?.products?.total || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminOrders')}>
                    <ShoppingCart size={32} color="#7ED321" />
                    <Text style={styles.cardTitle}>Đơn hàng</Text>
                    <Text style={styles.cardValue}>{stats?.orders?.total || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card}>
                    <DollarSign size={32} color="#D0021B" />
                    <Text style={styles.cardTitle}>Doanh thu h.nay</Text>
                    <Text style={styles.cardValue}>{stats?.revenue?.today?.toLocaleString('vi-VN') || 0} đ</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminEvents')}>
                    <Calendar size={32} color="#9013FE" />
                    <Text style={styles.cardTitle}>Thống kê Cây Ảo</Text>
                    <Text style={styles.cardValue}>Xem chi tiết</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => onNavigate('adminQuests')}>
                    <Target size={32} color="#50E3C2" />
                    <Text style={styles.cardTitle}>Nhiệm vụ H.Ngày</Text>
                    <Text style={styles.cardValue}>Xem chi tiết</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#2E7D32', paddingTop: 40 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    logoutBtn: { padding: 5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
    card: { 
        width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 10, 
        alignItems: 'center', marginBottom: 15, elevation: 3, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 
    },
    cardTitle: { fontSize: 14, color: '#555', marginTop: 10, fontWeight: '600' },
    cardValue: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 5 }
});
