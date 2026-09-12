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
import { ArrowLeft, Sprout, Gift, Award, CheckCircle2, RotateCcw, TrendingUp } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import apiConfig from '../../api.json';

const BASE_URL = apiConfig.baseUrl || "http://192.168.190.52:8080";

const STAGE_NAMES: Record<number, string> = {
  1: "Giai đoạn 1: Hạt mầm 🌱",
  2: "Giai đoạn 2: Nảy mầm 🌿",
  3: "Giai đoạn 3: Cây non 🪴",
  4: "Giai đoạn 4: Trưởng thành 🌳",
  5: "Giai đoạn 5: Ra hoa / Thu hoạch 🌸"
};

export default function AdminEventsScreen({ onBack }: { onBack: () => void }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/events/stats`, {
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
        console.warn("API thống kê sự kiện trả về không thành công:", data?.message);
      }
    } catch (err) {
      console.error("Lỗi lấy thống kê cây ảo:", err);
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

  const totalParticipants = stats?.total_participants || 0;
  const stages = stats?.stages_distribution || [];
  const vouchers = stats?.vouchers || { total: 0, available: 0, used: 0, per_stage: [] };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thống kê Cây Ảo</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RotateCcw size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />}
      >
        {/* Metric Cards Grid */}
        <View style={styles.grid}>
          <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
            <View style={styles.statIconBox}>
              <Sprout size={24} color="#2E7D32" />
            </View>
            <View>
              <Text style={styles.statLabel}>Người tham gia</Text>
              <Text style={styles.statVal}>{totalParticipants}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Gift size={24} color="#E65100" />
            </View>
            <View>
              <Text style={styles.statLabel}>Voucher phát ra</Text>
              <Text style={styles.statVal}>{vouchers.total}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Award size={24} color="#1565C0" />
            </View>
            <View>
              <Text style={styles.statLabel}>Chưa dùng</Text>
              <Text style={styles.statVal}>{vouchers.available}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#9C27B0' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#F3E5F5' }]}>
              <CheckCircle2 size={24} color="#7B1FA2" />
            </View>
            <View>
              <Text style={styles.statLabel}>Đã sử dụng</Text>
              <Text style={styles.statVal}>{vouchers.used}</Text>
            </View>
          </View>
        </View>

        {/* Stage Distribution Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Phân bố người chơi theo giai đoạn</Text>
          </View>

          {stages.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có người dùng trồng cây.</Text>
          ) : (
            stages.map((st: any, idx: number) => {
              const stageNum = Number(st.stage);
              const stageLabel = STAGE_NAMES[stageNum] || `Giai đoạn ${stageNum}`;
              const count = Number(st.count || 0);
              const percent = totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0;

              return (
                <View key={idx} style={styles.barItem}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.barLabel}>{stageLabel}</Text>
                    <Text style={styles.barCount}>
                      {count} người ({percent}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%` }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Vouchers Per Stage Section */}
        <View style={[styles.sectionCard, { marginBottom: 30 }]}>
          <View style={styles.sectionHeader}>
            <Gift size={18} color="#E65100" />
            <Text style={styles.sectionTitle}>Voucher được nhận theo từng mốc cây</Text>
          </View>

          {(!vouchers.per_stage || vouchers.per_stage.length === 0) ? (
            <Text style={styles.emptyText}>Chưa có voucher nào được nhận từ cây.</Text>
          ) : (
            vouchers.per_stage.map((vs: any, idx: number) => {
              const stageNum = Number(vs.source_stage);
              const stageLabel = STAGE_NAMES[stageNum] || `Mốc giai đoạn ${stageNum}`;
              return (
                <View key={idx} style={styles.voucherStageRow}>
                  <Text style={styles.voucherStageName}>{stageLabel}</Text>
                  <View style={styles.voucherBadge}>
                    <Text style={styles.voucherBadgeText}>{vs.count} mã</Text>
                  </View>
                </View>
              );
            })
          )}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 2 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barItem: { marginBottom: 12 },
  barLabel: { fontSize: 13, color: '#444', fontWeight: '500' },
  barCount: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4
  },
  voucherStageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0'
  },
  voucherStageName: { fontSize: 13, color: '#333', fontWeight: '500' },
  voucherBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  voucherBadgeText: { color: '#E65100', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }
});
