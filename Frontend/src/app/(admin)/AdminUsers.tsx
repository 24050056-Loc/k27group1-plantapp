import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Search } from 'lucide-react-native';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

export default function AdminUsersScreen({ onBack }: { onBack: () => void }) {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = (p: number, s: string) => {
        setLoading(true);
        fetch(`${BASE_URL}/api/admin/users?page=${p}&limit=20&search=${s}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setUsers(data.data);
                setTotalPages(data.totalPages);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchUsers(page, search);
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchUsers(1, search);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.title}>ID: {item.id} - {item.ho_ten}</Text>
            <Text style={styles.text}>Email: {item.email}</Text>
            <Text style={styles.text}>SĐT: {item.so_dien_thoai || 'Không có'}</Text>
            <Text style={styles.text}>Vai trò: {item.vai_tro}</Text>
            <Text style={styles.text}>Ngày tạo: {new Date(item.ngay_tao).toLocaleDateString('vi-VN')}</Text>
            <Text style={item.dang_hoat_dong ? styles.statusActive : styles.statusInactive}>Trạng thái: {item.dang_hoat_dong ? 'Hoạt động' : 'Bị khóa'}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Người dùng (Chỉ xem)</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Tìm tên, email, sđt..." 
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Search size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator size="large" color="#2E7D32" style={{marginTop: 20}} /> : (
                <FlatList
                    data={users}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 10 }}
                    ListEmptyComponent={<Text style={styles.empty}>Không có dữ liệu</Text>}
                />
            )}

            <View style={styles.pagination}>
                <TouchableOpacity disabled={page === 1} onPress={() => setPage(page - 1)}>
                    <Text style={[styles.pageBtn, page === 1 && styles.disabled]}>Trang trước</Text>
                </TouchableOpacity>
                <Text style={styles.pageText}>{page} / {totalPages}</Text>
                <TouchableOpacity disabled={page === totalPages || totalPages === 0} onPress={() => setPage(page + 1)}>
                    <Text style={[styles.pageBtn, (page === totalPages || totalPages === 0) && styles.disabled]}>Trang sau</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#2E7D32', paddingTop: 40 },
    backBtn: { marginRight: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', elevation: 2 },
    searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, paddingHorizontal: 10, height: 40 },
    searchBtn: { backgroundColor: '#2E7D32', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 5, marginLeft: 10 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    text: { fontSize: 14, color: '#444', marginBottom: 3 },
    statusActive: { fontSize: 14, fontWeight: 'bold', color: 'green', marginTop: 5 },
    statusInactive: { fontSize: 14, fontWeight: 'bold', color: 'red', marginTop: 5 },
    empty: { textAlign: 'center', marginTop: 20, color: '#888' },
    pagination: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
    pageBtn: { color: '#2E7D32', fontWeight: 'bold' },
    disabled: { color: '#ccc' },
    pageText: { fontSize: 16 }
});
