import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { ArrowLeft, Target, Calendar, CheckSquare, Eye, Sprout, RotateCcw, Award } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

export default function AdminQuestsScreen({ onBack }: { onBack: () => void }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/quests/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Lỗi phản hồi không phải định dạng JSON từ server (HTTP " + res.status + "):", text.substring(0, 200));
        return;
      }
      if (data && data.success) {
        setStats(data.data);
      } else {
        console.warn("API thống kê nhiệm vụ trả về không thành công:", data?.message);
      }
    } catch (err) {
      console.error("Lỗi lấy thống kê nhiệm vụ:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const quests = stats?.quests || { login_completed: 0, view_product_completed: 0, daily_seed_claimed: 0 };
  const dateStr = stats?.date || new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nhiệm vụ Hàng ngày</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RotateCcw size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />}
      >
        {/* Date Banner */}
        <View style={styles.dateBanner}>
          <Calendar size={18} color="#2E7D32" />
          <Text style={styles.dateText}>Số liệu ghi nhận ngày: <Text style={styles.dateHighlight}>{dateStr}</Text></Text>
        </View>

        {/* Quest Metrics Cards */}
        <View style={styles.questCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <CheckSquare size={26} color="#2E7D32" />
          </View>
          <View style={styles.questDetails}>
            <Text style={styles.questName}>Đăng nhập hàng ngày</Text>
            <Text style={styles.questDesc}>Người dùng mở ứng dụng và hoàn thành điểm danh ngày.</Text>
            <View style={styles.questMetaRow}>
              <Text style={styles.questCountLabel}>Số lượt hoàn thành hôm nay:</Text>
              <Text style={[styles.questCountVal, { color: '#2E7D32' }]}>{quests.login_completed}</Text>
            </View>
          </View>
        </View>

        <View style={styles.questCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
            <Eye size={26} color="#1565C0" />
          </View>
          <View style={styles.questDetails}>
            <Text style={styles.questName}>Khám phá cây cảnh (Xem Mall)</Text>
            <Text style={styles.questDesc}>Người dùng vào Cửa hàng và xem chi tiết sản phẩm.</Text>
            <View style={styles.questMetaRow}>
              <Text style={styles.questCountLabel}>Số lượt hoàn thành hôm nay:</Text>
              <Text style={[styles.questCountVal, { color: '#1565C0' }]}>{quests.view_product_completed}</Text>
            </View>
          </View>
        </View>

        <View style={styles.questCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
            <Sprout size={26} color="#E65100" />
          </View>
          <View style={styles.questDetails}>
            <Text style={styles.questName}>Nhận hạt giống miễn phí</Text>
            <Text style={styles.questDesc}>Người dùng nhận thêm hạt giống để gieo trồng cây mới.</Text>
            <View style={styles.questMetaRow}>
              <Text style={styles.questCountLabel}>Số lượt đã nhận hôm nay:</Text>
              <Text style={[styles.questCountVal, { color: '#E65100' }]}>{quests.daily_seed_claimed}</Text>
            </View>
          </View>
        </View>

        {/* Informative Note */}
        <View style={styles.infoBox}>
          <Award size={20} color="#1565C0" />
          <Text style={styles.infoBoxText}>
            Hệ thống nhiệm vụ tự động làm mới vào lúc 00:00 hàng ngày. Người dùng hoàn thành nhiệm vụ sẽ nhận thêm Nước và Phân bón để chăm sóc cây ảo.
          </Text>
        </View>
      </ScrollView>
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
  refreshBtn: { padding: 6 },
  body: { flex: 1, padding: 14 },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16
  },
  dateText: { fontSize: 14, color: '#333' },
  dateHighlight: { fontWeight: 'bold', color: '#1B5E20' },
  questCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    alignItems: 'flex-start'
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  questDetails: { flex: 1 },
  questName: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  questDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 10 },
  questMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F0F0F0'
  },
  questCountLabel: { fontSize: 13, color: '#555' },
  questCountVal: { fontSize: 18, fontWeight: 'bold' },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 30
  },
  infoBoxText: { flex: 1, fontSize: 13, color: '#0D47A1', lineHeight: 18 }
});
