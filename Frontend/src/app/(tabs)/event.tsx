import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import Svg, {
  Ellipse,
  Path,
  Circle,
  G,
} from "react-native-svg";
import { Bell, Star, CheckCircle2, Gift, Ticket, Truck, X, ChevronRight, Droplets, Leaf, Copy, Sparkles, Tag, Sprout } from "lucide-react-native";
import {
  requestNotificationPermission,
  scheduleDailyWaterReminder,
  cancelDailyWaterReminder,
  sendVoucherReadyNotification,
  scheduleStageAlmostDoneNotification,
} from "../../services/notificationService";
import { useVoucher } from "../../context/VoucherContext";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import { resolveProductImageByName } from "../../assets/productImages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Hằng số Game ─────────────────────────────────────────────────────────────
const STAGE_BASE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 giờ = 14 400 000 ms
const WATER_REDUCE_MS = 30 * 60 * 1000;             // Tưới nước: -30 phút
const FERT_REDUCE_MS = 60 * 60 * 1000;              // Bón phân:  -60 phút
const DEFAULT_WATER_MAX = 3;
const DEFAULT_FERT_MAX = 1;

type Seed = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  care: string;
  growthTime: string;
  color: string;
  tag: string;
  price: string;
  image: ReturnType<typeof resolveProductImageByName>;
  growthStages: GrowthStage[];
};

type GrowthStage = {
  title: string;
  age: string;
  description: string;
  image: ReturnType<typeof resolveProductImageByName>;
};

function createGrowthStages(
  image: ReturnType<typeof resolveProductImageByName>,
  descriptions: [string, string, string, string],
): GrowthStage[] {
  return [
    { title: "Cây con", age: "0-6 tháng", description: descriptions[0], image },
    { title: "Cây đang lớn", age: "6 tháng-2 năm", description: descriptions[1], image },
    { title: "Cây trưởng thành", age: "2-5 năm", description: descriptions[2], image },
    { title: "Ra hoa / kết trái", age: "Từ 5 năm", description: descriptions[3], image },
  ];
}

const SEED_DATA: Seed[] = [
  { id: "bang-dai-loan", name: "Cây Bàng Đài Loan", emoji: "🌳", description: "Tán cây thanh thoát, tạo cảm giác xanh mát cho không gian sống.", care: "Ưa sáng, tưới 2-3 lần/tuần", growthTime: "4 giờ/1 giai đoạn", color: "#2E7D32", tag: "Bán chạy #1", price: "250.000đ", image: resolveProductImageByName("Cây Bàng Đài Loan"), growthStages: createGrowthStages(resolveProductImageByName("Cây Bàng Đài Loan"), ["Thân mảnh, lá nhỏ và cần giữ ẩm đều.", "Tán bắt đầu mở rộng, cần nhiều ánh sáng.", "Tán cây phân nhánh rõ và chịu nắng tốt.", "Cây tạo tán đẹp, thường được trồng làm cây cảnh."]) },
  { id: "sau-rieng-ri6", name: "Sầu Riêng Ri6", emoji: "🌱", description: "Giống cây khỏe, được yêu thích bởi hương vị thơm ngon đặc trưng.", care: "Ưa nắng, đất thoát nước tốt", growthTime: "4 giờ/1 giai đoạn", color: "#8D6E63", tag: "Bán chạy", price: "150.000đ", image: resolveProductImageByName("Sầu Riêng Ri6"), growthStages: createGrowthStages(resolveProductImageByName("Sầu Riêng Ri6"), ["Cây con cần che nắng gắt và tưới đều.", "Thân vươn nhanh, bắt đầu tạo tán.", "Cây ra hoa khi đủ tuổi và được chăm đúng cách.", "Cho trái Ri6 thơm béo khi cây trưởng thành."]) },
  { id: "luoi-ho", name: "Cây Lưỡi Hổ", emoji: "🌿", description: "Cây lọc không khí dễ chăm, phù hợp cho phòng làm việc và phòng ngủ.", care: "Ưa sáng nhẹ, tưới 1 lần/tuần", growthTime: "4 giờ/1 giai đoạn", color: "#558B2F", tag: "Dễ trồng", price: "120.000đ", image: resolveProductImageByName("Cây Lưỡi Hổ"), growthStages: createGrowthStages(resolveProductImageByName("Cây Lưỡi Hổ"), ["Lá non mọc thành cụm nhỏ.", "Lá dài và cứng dần, hình thành bụi.", "Bụi lá đầy đặn, lọc không khí tốt.", "Có thể ra hoa thơm khi cây đủ khỏe."]) },
  { id: "mang-cut", name: "Cây Măng Cụt", emoji: "🌱", description: "Cây ăn trái nhiệt đới xanh tốt, phù hợp cho khu vườn gia đình.", care: "Ưa nắng, tưới đều mỗi ngày", growthTime: "4 giờ/1 giai đoạn", color: "#2E7D32", tag: "Được yêu thích", price: "110.000đ", image: resolveProductImageByName("Cây Măng Cụt"), growthStages: createGrowthStages(resolveProductImageByName("Cây Măng Cụt"), ["Cây con ưa ẩm và cần đất giàu dinh dưỡng.", "Thân cứng hơn, lá xanh đậm và tán rộng.", "Cây khỏe, bắt đầu tích lũy dinh dưỡng.", "Ra hoa và cho quả măng cụt theo mùa."]) },
  { id: "buoi-da-xanh", name: "Bưởi Da Xanh", emoji: "🍃", description: "Giống bưởi quen thuộc, cho trái ngon và cây phát triển khỏe.", care: "Ưa nắng, tưới 2-3 lần/tuần", growthTime: "4 giờ/1 giai đoạn", color: "#388E3C", tag: "Bán chạy", price: "95.000đ", image: resolveProductImageByName("Bưởi Da Xanh"), growthStages: createGrowthStages(resolveProductImageByName("Bưởi Da Xanh"), ["Cây con cần nắng nhẹ và tưới đều.", "Tán lá mở rộng, thân bắt đầu hóa gỗ.", "Cây trưởng thành có thể ra hoa nhiều đợt.", "Cho những chùm bưởi da xanh mọng nước."]) },
  { id: "chom-chom-thai", name: "Cây Chôm Chôm Thái", emoji: "🌿", description: "Cây ăn trái nhiệt đới nổi bật, mang màu xanh tươi cho khu vườn.", care: "Ưa nắng, đất ẩm vừa phải", growthTime: "4 giờ/1 giai đoạn", color: "#43A047", tag: "Mới yêu thích", price: "90.000đ", image: resolveProductImageByName("Cây Chôm Chôm Thái"), growthStages: createGrowthStages(resolveProductImageByName("Cây Chôm Chôm Thái"), ["Lá non xanh sáng, cần giữ ẩm cho rễ.", "Cành lá phát triển mạnh và tạo tán.", "Cây trưởng thành sẵn sàng phân hóa mầm hoa.", "Kết thành chùm chôm chôm đỏ đẹp khi vào mùa."]) },
];

// ─── Dữ liệu Stage ────────────────────────────────────────────────────────────
const STAGE_META = {
  0: {
    label: "Chưa trồng",
    emoji: "🪴",
    color: "#78909C",
    bg: "#ECEFF1",
    desc: "Chọn một hạt giống để bắt đầu khu vườn.",
    nextLabel: "Cây non",
    voucher: { code: "", label: "", icon: "ticket" },
  },
  1: {
    label: "Cây non",
    emoji: "🌱",
    color: "#66BB6A",
    bg: "#E8F5E9",
    desc: "Mới nảy mầm, cần được chăm sóc.",
    nextLabel: "Đang lớn",
    voucher: { code: "PLANT10", label: "Voucher 10% OFF", icon: "ticket" },
  },
  2: {
    label: "Đang lớn",
    emoji: "🌿",
    color: "#388E3C",
    bg: "#C8E6C9",
    desc: "Cây đang phát triển tốt!",
    nextLabel: "Trưởng thành",
    voucher: { code: "PLANT20", label: "Voucher 20% OFF", icon: "ticket" },
  },
  3: {
    label: "Trưởng thành",
    emoji: "🌸",
    color: "#1B5E20",
    bg: "#A5D6A7",
    desc: "Cây ra hoa rực rỡ!",
    nextLabel: "Nở rộ hoàn toàn",
    voucher: { code: "PLANT50K", label: "Voucher 50.000đ + Free Ship", icon: "truck" },
  },
  4: {
    label: "Nở rộ",
    emoji: "🌺",
    color: "#FF6F00",
    bg: "#FFF8E1",
    desc: "Cây đạt đỉnh cao rực rỡ!",
    nextLabel: null,
    voucher: { code: "PLANT50", label: "Voucher 50% OFF 🔥", icon: "ticket" },
  },
} as const;

type StageKey = 0 | 1 | 2 | 3 | 4;

// ─── Dữ liệu Nhiệm vụ ─────────────────────────────────────────────────────────
const MISSION_DATA = [
  { label: "Đăng nhập mỗi ngày", desc: "Phần thưởng: +1 lượt Tưới nước 💧", reward: "water" },
  { label: "Xem 3 sản phẩm",     desc: "Phần thưởng: +1 lượt Tưới nước 💧", reward: "water" },
  { label: "Mua 1 cây bất kỳ",   desc: "Phần thưởng: +1 lượt Bón phân 🌿", reward: "fert"  },
  { label: "Chia sẻ sự kiện",    desc: "Phần thưởng: +1 lượt Tưới nước 💧", reward: "water" },
  { label: "Khám phá cộng đồng", desc: "Phần thưởng: 1 hạt giống ngẫu nhiên 🌱", reward: "seed" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// SVG Plants (react-native-svg)
// ─────────────────────────────────────────────────────────────────────────────

function SeedlingPlant() {
  return (
    <Svg viewBox="0 0 200 220" width="100%" height="100%">
      <Ellipse cx="100" cy="200" rx="44" ry="7" fill="#BCAAA4" opacity="0.25" />
      <Path d="M70 162 L74 198 L126 198 L130 162 Z" fill="#8D6E63" />
      <Path d="M67 156 Q100 149 133 156 L130 164 Q100 157 70 164 Z" fill="#A1887F" />
      <Ellipse cx="100" cy="156" rx="33" ry="7" fill="#5D4037" />
      <Path d="M80 172 Q100 167 120 172" stroke="#A1887F" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M78 183 Q100 178 122 183" stroke="#A1887F" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M100 154 Q100 148 100 138" stroke="#66BB6A" strokeWidth="3" strokeLinecap="round" />
      <Ellipse cx="93" cy="138" rx="9" ry="5" fill="#81C784" transform="rotate(-20, 93, 138)" />
      <Ellipse cx="107" cy="138" rx="9" ry="5" fill="#66BB6A" transform="rotate(20, 107, 138)" />
      <Circle cx="100" cy="134" r="4" fill="#A5D6A7" />
      <Circle cx="100" cy="134" r="2" fill="#C8E6C9" />
      <Circle cx="89" cy="155" r="1.5" fill="#795548" opacity="0.5" />
      <Circle cx="100" cy="153" r="1.5" fill="#795548" opacity="0.5" />
      <Circle cx="111" cy="155" r="1.5" fill="#795548" opacity="0.5" />
    </Svg>
  );
}

function GrowingPlant() {
  return (
    <Svg viewBox="0 0 200 220" width="100%" height="100%">
      <Ellipse cx="100" cy="200" rx="44" ry="7" fill="#BCAAA4" opacity="0.25" />
      <Path d="M70 162 L74 198 L126 198 L130 162 Z" fill="#8D6E63" />
      <Path d="M67 156 Q100 149 133 156 L130 164 Q100 157 70 164 Z" fill="#A1887F" />
      <Ellipse cx="100" cy="156" rx="33" ry="7" fill="#5D4037" />
      <Path d="M80 172 Q100 167 120 172" stroke="#A1887F" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M78 183 Q100 178 122 183" stroke="#A1887F" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M100 154 Q99 135 100 112" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" />
      <Path d="M100 142 Q88 132 80 136" stroke="#43A047" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M80 136 Q76 128 84 126 Q90 134 80 136Z" fill="#66BB6A" />
      <Path d="M100 142 Q112 132 120 136" stroke="#388E3C" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M120 136 Q124 128 116 126 Q110 134 120 136Z" fill="#4CAF50" />
      <Path d="M100 126 Q85 114 78 120 Q86 130 100 126Z" fill="#43A047" />
      <Path d="M100 126 Q115 114 122 120 Q114 130 100 126Z" fill="#388E3C" />
      <Circle cx="100" cy="109" r="6" fill="#A5D6A7" />
      <Circle cx="100" cy="109" r="3.5" fill="#C8E6C9" />
      <Circle cx="64" cy="128" r="2" fill="#FDD835" opacity="0.6" />
      <Circle cx="136" cy="120" r="2" fill="#FDD835" opacity="0.5" />
    </Svg>
  );
}

function MaturePlant() {
  return (
    <Svg viewBox="0 0 200 220" width="100%" height="100%">
      <Ellipse cx="100" cy="200" rx="44" ry="7" fill="#BCAAA4" opacity="0.3" />
      <Path d="M70 162 L74 198 L126 198 L130 162 Z" fill="#8D6E63" />
      <Path d="M67 156 Q100 149 133 156 L130 164 Q100 157 70 164 Z" fill="#A1887F" />
      <Ellipse cx="100" cy="156" rx="33" ry="7" fill="#5D4037" />
      <Path d="M80 172 Q100 167 120 172" stroke="#A1887F" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M78 183 Q100 178 122 183" stroke="#A1887F" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M100 154 Q98 128 100 100" stroke="#2E7D32" strokeWidth="4.5" strokeLinecap="round" />
      <Path d="M100 136 Q86 122 76 118" stroke="#388E3C" strokeWidth="3" strokeLinecap="round" />
      <Path d="M100 136 Q114 122 124 118" stroke="#388E3C" strokeWidth="3" strokeLinecap="round" />
      <Path d="M76 118 Q60 106 64 94 Q76 104 76 118Z" fill="#43A047" />
      <Path d="M124 118 Q140 106 136 94 Q124 104 124 118Z" fill="#388E3C" />
      <Path d="M100 126 Q82 110 72 116 Q82 128 100 126Z" fill="#2E7D32" />
      <Path d="M100 126 Q118 110 128 116 Q118 128 100 126Z" fill="#388E3C" />
      <Path d="M100 112 Q84 98 76 104 Q86 116 100 112Z" fill="#43A047" />
      <Path d="M100 112 Q116 98 124 104 Q114 116 100 112Z" fill="#2E7D32" />
      <Circle cx="100" cy="88" r="7.5" fill="#FFEE58" />
      <Circle cx="100" cy="76" r="7" fill="#FFF176" />
      <Circle cx="111" cy="82" r="7" fill="#FFEE58" />
      <Circle cx="89" cy="82" r="7" fill="#FFF176" />
      <Circle cx="109" cy="94" r="7" fill="#FFEE58" />
      <Circle cx="91" cy="94" r="7" fill="#FFF176" />
      <Circle cx="100" cy="85" r="10" fill="#FF8F00" />
      <Circle cx="100" cy="85" r="7" fill="#FFB300" />
      <Circle cx="97" cy="82" r="1.8" fill="#E65100" />
      <Circle cx="103" cy="82" r="1.8" fill="#E65100" />
      <Circle cx="100" cy="79" r="1.8" fill="#E65100" />
      <Circle cx="97" cy="88" r="1.8" fill="#E65100" />
      <Circle cx="103" cy="88" r="1.8" fill="#E65100" />
      <Circle cx="100" cy="91" r="1.8" fill="#E65100" />
      <Circle cx="55" cy="104" r="3" fill="#FDD835" opacity="0.75" />
      <Circle cx="145" cy="98" r="2.5" fill="#FDD835" opacity="0.65" />
    </Svg>
  );
}

function FullBloomPlant() {
  return (
    <Svg viewBox="0 0 200 220" width="100%" height="100%">
      <Ellipse cx="100" cy="205" rx="50" ry="8" fill="#BCAAA4" opacity="0.35" />
      <Path d="M68 162 L72 198 L128 198 L132 162 Z" fill="#6D4C41" />
      <Path d="M65 155 Q100 147 135 155 L132 163 Q100 155 68 163 Z" fill="#8D6E63" />
      <Ellipse cx="100" cy="155" rx="35" ry="8" fill="#4E342E" />
      <Path d="M78 172 Q100 167 122 172" stroke="#8D6E63" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M76 184 Q100 179 124 184" stroke="#8D6E63" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M100 153 Q98 122 100 88" stroke="#1B5E20" strokeWidth="5" strokeLinecap="round" />
      <Path d="M100 138 Q82 118 68 114" stroke="#2E7D32" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M100 138 Q118 118 132 114" stroke="#2E7D32" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M68 114 Q48 100 52 84 Q68 96 68 114Z" fill="#388E3C" />
      <Path d="M132 114 Q152 100 148 84 Q132 96 132 114Z" fill="#2E7D32" />
      <Path d="M100 124 Q78 104 64 112 Q78 126 100 124Z" fill="#1B5E20" />
      <Path d="M100 124 Q122 104 136 112 Q122 126 100 124Z" fill="#2E7D32" />
      <Path d="M100 110 Q80 92 68 100 Q82 116 100 110Z" fill="#43A047" />
      <Path d="M100 110 Q120 92 132 100 Q118 116 100 110Z" fill="#2E7D32" />
      {/* Multi-color flowers cluster */}
      <Circle cx="100" cy="75" r="8" fill="#FF80AB" />
      <Circle cx="100" cy="61" r="7.5" fill="#FF4081" />
      <Circle cx="113" cy="68" r="7.5" fill="#FF80AB" />
      <Circle cx="87" cy="68" r="7.5" fill="#F48FB1" />
      <Circle cx="111" cy="82" r="7" fill="#FF80AB" />
      <Circle cx="89" cy="82" r="7" fill="#FF4081" />
      <Circle cx="100" cy="72" r="11" fill="#E91E63" />
      <Circle cx="100" cy="72" r="8" fill="#F06292" />
      <Circle cx="97" cy="69" r="2" fill="#AD1457" />
      <Circle cx="103" cy="69" r="2" fill="#AD1457" />
      <Circle cx="100" cy="66" r="2" fill="#AD1457" />
      <Circle cx="97" cy="75" r="2" fill="#AD1457" />
      <Circle cx="103" cy="75" r="2" fill="#AD1457" />
      {/* Small secondary flowers */}
      <Circle cx="62" cy="106" r="5" fill="#CE93D8" />
      <Circle cx="62" cy="106" r="3" fill="#BA68C8" />
      <Circle cx="138" cy="102" r="5" fill="#80DEEA" />
      <Circle cx="138" cy="102" r="3" fill="#4DD0E1" />
      {/* Sparkles */}
      <Circle cx="50" cy="96" r="3.5" fill="#FDD835" opacity="0.85" />
      <Circle cx="150" cy="88" r="3" fill="#FDD835" opacity="0.75" />
      <Circle cx="46" cy="120" r="2.5" fill="#A5D6A7" opacity="0.9" />
      <Circle cx="154" cy="114" r="2.5" fill="#A5D6A7" opacity="0.9" />
      <Path d="M56 88 L58 82 L60 88 L54 85 L62 85Z" fill="#FDD835" opacity="0.8" />
      <Path d="M140 80 L142 74 L144 80 L138 77 L146 77Z" fill="#FDD835" opacity="0.7" />
    </Svg>
  );
}

function EmptyPotPlant({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.emptyPotButton} onPress={onPress} activeOpacity={0.8}>
      <Svg viewBox="0 0 200 220" width="100%" height="100%">
        <Ellipse cx="100" cy="200" rx="44" ry="7" fill="#BCAAA4" opacity="0.25" />
        <Path d="M70 162 L74 198 L126 198 L130 162 Z" fill="#8D6E63" />
        <Path d="M67 156 Q100 149 133 156 L130 164 Q100 157 70 164 Z" fill="#A1887F" />
        <Ellipse cx="100" cy="156" rx="33" ry="7" fill="#5D4037" />
      </Svg>
      <View style={styles.emptyPotPlus}>
        <Text style={styles.emptyPotPlusText}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

function PlantIllustration({ stage }: { stage: StageKey }) {
  if (stage === 0) return null;
  if (stage === 1) return <SeedlingPlant />;
  if (stage === 2) return <GrowingPlant />;
  if (stage === 3) return <MaturePlant />;
  return <FullBloomPlant />;
}

// ─── Utility: Format thời gian ────────────────────────────────────────────────
function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Component: VoucherDialog ─────────────────────────────────────────────────
function VoucherDialog({
  visible,
  stage,
  onClaimNow,
  onContinue,
}: {
  visible: boolean;
  stage: StageKey;
  onClaimNow: () => void;
  onContinue: () => void;
}) {
  const meta = STAGE_META[stage];
  const nextStage = (stage < 4 ? stage + 1 : null) as StageKey | null;
  const nextMeta = nextStage ? STAGE_META[nextStage] : null;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.voucherDialog, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.voucherDialogHeader}>
            <Text style={styles.voucherDialogEmoji}>{meta.emoji}</Text>
            <Text style={styles.voucherDialogTitle}>Cây đạt {meta.label}!</Text>
            <Text style={styles.voucherDialogSubtitle}>
              Bạn đã mở khóa phần thưởng mới 🎉
            </Text>
          </View>

          {/* Current Voucher */}
          <View style={styles.voucherCurrentBox}>
            <View style={styles.voucherCurrentBadge}>
              <Gift size={18} stroke="#FF8F00" />
              <Text style={styles.voucherCurrentLabel}>{meta.voucher.label}</Text>
            </View>
            <Text style={styles.voucherCode}>Mã: {meta.voucher.code}</Text>
          </View>

          {/* Divider */}
          <Text style={styles.voucherDivider}>Chọn một trong hai:</Text>

          {/* Option 1: Lấy ngay */}
          <TouchableOpacity
            style={styles.voucherOptionClaim}
            onPress={onClaimNow}
            activeOpacity={0.85}
          >
            <View style={styles.voucherOptionIcon}>
              <Gift size={22} stroke="#fff" />
            </View>
            <View style={styles.voucherOptionText}>
              <Text style={styles.voucherOptionTitle}>🎁 Lấy voucher ngay</Text>
              <Text style={styles.voucherOptionDesc}>{meta.voucher.label}</Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Tiếp tục (chỉ hiện nếu chưa stage cuối) */}
          {nextMeta && (
            <TouchableOpacity
              style={styles.voucherOptionContinue}
              onPress={onContinue}
              activeOpacity={0.85}
            >
              <View style={[styles.voucherOptionIcon, { backgroundColor: nextMeta.color }]}>
                <Text style={{ fontSize: 18 }}>{nextMeta.emoji}</Text>
              </View>
              <View style={styles.voucherOptionText}>
                <Text style={[styles.voucherOptionTitle, { color: nextMeta.color }]}>
                  🌱 Tiếp tục trồng cây
                </Text>
                <Text style={styles.voucherOptionDesc}>
                  Lên {nextMeta.label} → {nextMeta.voucher.label}
                </Text>
              </View>
              <ChevronRight size={18} stroke={nextMeta.color} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Component: MissionSheet ──────────────────────────────────────────────────
function MissionSheet({
  visible,
  missions,
  onClose,
  onClaim,
  onExplore,
}: {
  visible: boolean;
  missions: boolean[];
  onClose: () => void;
  onClaim: (index: number) => void;
  onExplore: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const completed = missions.filter(Boolean).length;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.sheetBackdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.missionSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View style={styles.sheetIconBg}>
                <Star size={18} stroke="#2E7D32" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Nhiệm vụ hằng ngày</Text>
                <Text style={styles.sheetSubtitle}>Hoàn thành để nhận thêm lượt</Text>
              </View>
            </View>
            <View style={styles.sheetHeaderRight}>
              <View style={styles.sheetBadge}>
                <Text style={styles.sheetBadgeText}>{completed}/{MISSION_DATA.length}</Text>
              </View>
              <TouchableOpacity style={styles.sheetCloseBtn} onPress={onClose}>
                <X size={16} stroke="#555" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {MISSION_DATA.map((m, i) => (
              <View key={i} style={styles.missionRow}>
                <View style={[styles.missionIconBox, { backgroundColor: missions[i] ? "#E8F5E9" : "#FFF8E1", borderColor: missions[i] ? "#A5D6A7" : "#FFD54F" }]}>
                  {missions[i]
                    ? <CheckCircle2 size={18} stroke="#2E7D32" />
                    : <Star size={18} stroke="#FF8F00" />}
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionLabel}>{m.label}</Text>
                  <Text style={styles.missionDesc}>{m.desc}</Text>
                </View>
                {missions[i] ? (
                  <View style={styles.missionDoneTag}>
                    <Text style={styles.missionDoneText}>Xong ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.missionClaimBtn}
                    onPress={() => MISSION_DATA[i].reward === "seed" ? onExplore() : onClaim(i)}
                  >
                    <Text style={styles.missionClaimText}>{MISSION_DATA[i].reward === "seed" ? "Khám phá" : "Nhận"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.sheetCloseFullBtn} onPress={onClose}>
              <Text style={styles.sheetCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function SeedInfoModal({
  seed,
  onClose,
  onSelect,
}: {
  seed: Seed | null;
  onClose: () => void;
  onSelect: (seed: Seed) => void;
}) {
  if (!seed) return null;
  return (
    <Modal transparent visible={!!seed} animationType="fade" onRequestClose={onClose}>
      <View style={styles.seedModalBackdrop}>
        <View style={styles.seedModalCard}>
          <TouchableOpacity style={styles.seedModalClose} onPress={onClose}>
            <X size={18} stroke="#555" />
          </TouchableOpacity>
          <View style={[styles.seedModalIcon, { backgroundColor: seed.color + "18" }]}>
            <Image source={seed.image} style={styles.seedModalImage} />
          </View>
          <Text style={[styles.seedModalTag, { color: seed.color }]}>{seed.tag}</Text>
          <Text style={styles.seedModalTitle}>{seed.name}</Text>
          <Text style={styles.seedModalDescription}>{seed.description}</Text>
          <Text style={styles.growthTimelineTitle}>Các giai đoạn phát triển ngoài đời</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.growthTimeline}
          >
            {seed.growthStages.map((growthStage, index) => (
              <View key={growthStage.title} style={[styles.growthStageCard, { borderColor: seed.color + "44" }]}>
                <View style={styles.growthStageImageWrap}>
                  <Image source={growthStage.image} style={styles.growthStageImage} />
                  <View style={[styles.growthStageNumber, { backgroundColor: seed.color }]}> 
                    <Text style={styles.growthStageNumberText}>{index + 1}</Text>
                  </View>
                </View>
                <Text style={styles.growthStageTitle}>{growthStage.title}</Text>
                <Text style={[styles.growthStageAge, { color: seed.color }]}>{growthStage.age}</Text>
                <Text style={styles.growthStageDescription}>{growthStage.description}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.seedDetailRow}>
            <View style={styles.seedDetailBox}>
              <Text style={styles.seedDetailLabel}>Thời gian</Text>
              <Text style={styles.seedDetailValue}>⏱ {seed.growthTime}</Text>
            </View>
            <View style={styles.seedDetailBox}>
              <Text style={styles.seedDetailLabel}>Chăm sóc</Text>
              <Text style={styles.seedDetailValue}>🌱 Dễ chăm</Text>
            </View>
          </View>
          <Text style={styles.seedCareText}>💧 {seed.care}</Text>
          <TouchableOpacity style={[styles.seedSelectButton, { backgroundColor: seed.color }]} onPress={() => onSelect(seed)}>
            <Sprout size={18} color="#fff" />
            <Text style={styles.seedSelectButtonText}>Chọn hạt này để trồng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SeedPickerModal({
  visible,
  onClose,
  onSelect,
  seeds,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (seed: Seed) => void;
  seeds: Seed[];
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.seedPickerBackdrop}>
        <View style={styles.seedPickerCard}>
          <View style={styles.seedPickerHeader}>
            <View>
              <Text style={styles.seedPickerTitle}>Chọn hạt giống</Text>
              <Text style={styles.seedPickerSubtitle}>Chọn một cây bestseller để bắt đầu trồng</Text>
            </View>
            <TouchableOpacity style={styles.seedModalClose} onPress={onClose}>
              <X size={18} stroke="#555" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.seedPickerList}>
            {seeds.length === 0 ? (
              <View style={styles.emptySeedInventory}>
                <Text style={styles.emptySeedInventoryEmoji}>🌱</Text>
                <Text style={styles.emptySeedInventoryTitle}>Chưa có hạt giống</Text>
                <Text style={styles.emptySeedInventoryText}>
                  Hoàn thành nhiệm vụ hằng ngày để nhận hạt giống ngẫu nhiên.
                </Text>
              </View>
            ) : seeds.map(seed => (
              <TouchableOpacity key={seed.id} style={styles.seedPickerRow} onPress={() => onSelect(seed)}>
                <Image source={seed.image} style={styles.seedPickerImage} />
                <View style={styles.seedPickerInfo}>
                  <Text style={styles.seedPickerName}>{seed.name}</Text>
                  <Text style={styles.seedPickerPrice}>{seed.price}</Text>
                  <Text style={styles.seedPickerCare}>{seed.care}</Text>
                </View>
                <ChevronRight size={18} color="#A5D6A7" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Component: ClaimedVoucherCard ────────────────────────────────────────────
function ClaimedVoucherCard({ stage }: { stage: StageKey }) {
  const meta = STAGE_META[stage];
  return (
    <View style={[styles.claimedCard, { borderColor: meta.color + "44", backgroundColor: meta.bg }]}>
      <View style={[styles.claimedIconBox, { backgroundColor: meta.color }]}>
        {meta.voucher.icon === "truck"
          ? <Truck size={16} stroke="#fff" />
          : <Ticket size={16} stroke="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.claimedLabel, { color: meta.color }]}>{meta.voucher.label}</Text>
        <Text style={styles.claimedCode}>Mã: {meta.voucher.code}</Text>
      </View>
      <View style={styles.claimedDot} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main EventScreen
// ─────────────────────────────────────────────────────────────────────────────

type EventScreenProps = {
  onOpenExplore?: () => void;
};

export default function EventScreen({ onOpenExplore }: EventScreenProps) {
  const { user } = useAuth();
  // ── State ──────────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<StageKey>(0);
  const [stageStartTime, setStageStartTime] = useState<number>(Date.now());
  const [timeReduced, setTimeReduced] = useState<number>(0);       // ms đã giảm
  const [waterTurns, setWaterTurns] = useState(DEFAULT_WATER_MAX);
  const [fertTurns, setFertTurns] = useState(DEFAULT_FERT_MAX);
  const [waterMax, setWaterMax] = useState(DEFAULT_WATER_MAX);
  const [fertMax, setFertMax] = useState(DEFAULT_FERT_MAX);
  const [missions, setMissions] = useState([false, false, false, false, false]);
  const [claimedVouchers, setClaimedVouchers] = useState<StageKey[]>([]);
  const [pendingVoucherStage, setPendingVoucherStage] = useState<StageKey | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [remainingMs, setRemainingMs] = useState(STAGE_BASE_DURATION_MS);
  const [notifScheduledId, setNotifScheduledId] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const progressLoadedRef = useRef(false);
  const progressApiAvailableRef = useRef(true);

  const saveProgress = useCallback(async (progress: {
    selectedSeed: Seed | null;
    stage: StageKey;
    stageStartTime: number;
    timeReduced: number;
    waterTurns: number;
    fertTurns: number;
    waterMax: number;
    fertMax: number;
    missions: boolean[];
    claimedVouchers: StageKey[];
    notifOn: boolean;
  }) => {
    if (!user?.id || !progressLoadedRef.current || !progressApiAvailableRef.current) return;
    try {
      await axiosClient.put("/api/game/progress", {
        userId: user.id,
        selectedSeed: progress.selectedSeed?.id || null,
        stage: progress.stage,
        stageStartTime: progress.stageStartTime,
        timeReduced: progress.timeReduced,
        waterTurns: progress.waterTurns,
        fertTurns: progress.fertTurns,
        waterMax: progress.waterMax,
        fertMax: progress.fertMax,
        missions: progress.missions,
        claimedVouchers: progress.claimedVouchers,
        notifOn: progress.notifOn,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        progressApiAvailableRef.current = false;
        return;
      }
      console.error("Lỗi lưu tiến trình sự kiện:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const loadProgress = async () => {
      try {
        const response = await axiosClient.get("/api/game/progress", { params: { userId: user.id } });
        const progress = response.data?.data;
        if (progress) {
          setStage(progress.stage as StageKey);
          setStageStartTime(Number(progress.stage_start_time));
          setTimeReduced(Number(progress.time_reduced));
          setWaterTurns(Number(progress.water_turns));
          setFertTurns(Number(progress.fert_turns));
          setWaterMax(Number(progress.water_max));
          setFertMax(Number(progress.fert_max));
          setMissions(progress.missions);
          setClaimedVouchers(progress.claimed_vouchers);
          setNotifOn(Boolean(progress.notif_on));
          setSelectedSeed(SEED_DATA.find(seed => seed.id === progress.selected_seed) || null);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          progressApiAvailableRef.current = false;
        } else {
          console.error("Lỗi tải tiến trình sự kiện:", error);
        }
      } finally {
        progressLoadedRef.current = true;
      }
    };
    loadProgress();
  }, [user?.id]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const waterBtnAnim = useRef(new Animated.Value(1)).current;
  const fertBtnAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // ── Timer real-time ────────────────────────────────────────────────────────
  const stageStartTimeRef = useRef(stageStartTime);
  const timeReducedRef = useRef(timeReduced);
  const stageRef = useRef(stage);

  useEffect(() => { stageStartTimeRef.current = stageStartTime; }, [stageStartTime]);
  useEffect(() => { timeReducedRef.current = timeReduced; }, [timeReduced]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const syncStageProgress = useCallback((currentStage: StageKey, currentStageStartTime: number, currentTimeReduced: number) => {
    if (currentStage === 0) {
      setRemainingMs(0);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      return;
    }

    const totalDuration = Math.max(1000, STAGE_BASE_DURATION_MS - currentTimeReduced);
    const elapsed = Date.now() - currentStageStartTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    setRemainingMs(remaining);

    const progress = Math.min(1, elapsed / totalDuration);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    if (remaining <= 0 && currentStage < 4) {
      const nextStage = (currentStage + 1) as StageKey;
      const nextStageStart = Date.now();
      setStage(nextStage);
      setStageStartTime(nextStageStart);
      setTimeReduced(0);
      setRemainingMs(STAGE_BASE_DURATION_MS);
      setPendingVoucherStage(nextStage);
      stageStartTimeRef.current = nextStageStart;
      timeReducedRef.current = 0;
      saveProgress({
        selectedSeed,
        stage: nextStage,
        stageStartTime: nextStageStart,
        timeReduced: 0,
        waterTurns,
        fertTurns,
        waterMax,
        fertMax,
        missions,
        claimedVouchers,
        notifOn,
      });
    }
  }, [progressAnim, saveProgress, selectedSeed, waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncStageProgress(stageRef.current, stageStartTimeRef.current, timeReducedRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [syncStageProgress]);

  // Progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ── Handler: Tưới nước ─────────────────────────────────────────────────────
  const handleWater = useCallback(() => {
    if (waterTurns <= 0 || stage === 0 || stage === 4) return;
    Animated.sequence([
      Animated.timing(waterBtnAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(waterBtnAnim, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
    ]).start();
    const nextWaterTurns = waterTurns - 1;
    const nextTimeReduced = Math.min(timeReduced + WATER_REDUCE_MS, STAGE_BASE_DURATION_MS - 1000);
    setWaterTurns(nextWaterTurns);
    setTimeReduced(nextTimeReduced);
    timeReducedRef.current = nextTimeReduced;
    syncStageProgress(stage, stageStartTime, nextTimeReduced);
    saveProgress({ selectedSeed, stage, stageStartTime, timeReduced: nextTimeReduced, waterTurns: nextWaterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn });
  }, [waterTurns, stage, timeReduced, selectedSeed, stageStartTime, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn, saveProgress, syncStageProgress]);

  // ── Handler: Bón phân ─────────────────────────────────────────────────────
  const handleFert = useCallback(() => {
    if (fertTurns <= 0 || stage === 0 || stage === 4) return;
    Animated.sequence([
      Animated.timing(fertBtnAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(fertBtnAnim, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
    ]).start();
    const nextFertTurns = fertTurns - 1;
    const nextTimeReduced = Math.min(timeReduced + FERT_REDUCE_MS, STAGE_BASE_DURATION_MS - 1000);
    setFertTurns(nextFertTurns);
    setTimeReduced(nextTimeReduced);
    timeReducedRef.current = nextTimeReduced;
    syncStageProgress(stage, stageStartTime, nextTimeReduced);
    saveProgress({ selectedSeed, stage, stageStartTime, timeReduced: nextTimeReduced, waterTurns, fertTurns: nextFertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn });
  }, [fertTurns, stage, timeReduced, selectedSeed, stageStartTime, waterTurns, waterMax, fertMax, missions, claimedVouchers, notifOn, saveProgress, syncStageProgress]);

  // ── Handler: Nhận nhiệm vụ ────────────────────────────────────────────────
  const handleClaimMission = useCallback((index: number) => {
    if (missions[index]) return;
    const nextMissions = [...missions];
    nextMissions[index] = true;
    setMissions(nextMissions);
    const reward = MISSION_DATA[index].reward;
    let nextWaterTurns = waterTurns;
    let nextFertTurns = fertTurns;
    let nextWaterMax = waterMax;
    let nextFertMax = fertMax;
    if (reward === "water") {
      nextWaterTurns += 1;
      nextWaterMax += 1;
      setWaterTurns(nextWaterTurns);
      setWaterMax(nextWaterMax);
    } else if (reward === "fert") {
      nextFertTurns += 1;
      nextFertMax += 1;
      setFertTurns(nextFertTurns);
      setFertMax(nextFertMax);
    }
    saveProgress({ selectedSeed, stage, stageStartTime, timeReduced, waterTurns: nextWaterTurns, fertTurns: nextFertTurns, waterMax: nextWaterMax, fertMax: nextFertMax, missions: nextMissions, claimedVouchers, notifOn });
  }, [missions, waterTurns, fertTurns, waterMax, fertMax, selectedSeed, stage, stageStartTime, timeReduced, claimedVouchers, notifOn, saveProgress]);

  const handleExploreMission = useCallback(() => {
    if (missions[4]) return;
    const rewardSeed = SEED_DATA[Math.floor(Math.random() * SEED_DATA.length)];
    const nextMissions = [...missions];
    nextMissions[4] = true;
    setMissions(nextMissions);
    setUnlockedSeeds(prev => prev.some(seed => seed.id === rewardSeed.id) ? prev : [...prev, rewardSeed]);
    setMissionOpen(false);
    saveProgress({ selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, missions: nextMissions, claimedVouchers, notifOn });
    Alert.alert(
      "Bạn nhận được hạt giống!",
      `${rewardSeed.emoji} ${rewardSeed.name} đã được thêm vào khu vườn.`,
      [{ text: "Khám phá ngay", onPress: onOpenExplore }, { text: "Để sau" }]
    );
  }, [missions, onOpenExplore, selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, claimedVouchers, notifOn, saveProgress]);

  const handleSelectSeed = useCallback((seed: Seed) => {
    setSelectedSeed(seed);
    setStage(1);
    setStageStartTime(Date.now());
    setTimeReduced(0);
    setRemainingMs(STAGE_BASE_DURATION_MS);
    setSeedPickerOpen(false);
    setSeedInfo(null);
    saveProgress({ selectedSeed: seed, stage: 1, stageStartTime: Date.now(), timeReduced: 0, waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn });
  }, [waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn, saveProgress]);

  const handleViewSeedInfo = useCallback((seed: Seed) => {
    setSeedPickerOpen(false);
    setSeedInfo(seed);
  }, []);

  const { addVoucher, collectedVouchers } = useVoucher();
  const [activeSubTab, setActiveSubTab] = useState<"game" | "promotions">("game");
  const [storeCoupons, setStoreCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [unlockedSeeds, setUnlockedSeeds] = useState<Seed[]>([]);
  const [seedInfo, setSeedInfo] = useState<Seed | null>(null);
  const [seedPickerOpen, setSeedPickerOpen] = useState(false);

  useEffect(() => {
    if (activeSubTab === "promotions") {
      async function fetchCoupons() {
        setLoadingCoupons(true);
        try {
          const res = await axiosClient.get("/coupons");
          if (res.data?.success && Array.isArray(res.data.data)) {
            setStoreCoupons(res.data.data);
          }
        } catch (e) {
          console.error("Lỗi lấy danh sách coupons:", e);
        } finally {
          setLoadingCoupons(false);
        }
      }
      fetchCoupons();
    }
  }, [activeSubTab]);

  const handleCopyCode = (code: string, label: string) => {
    addVoucher(code, label);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  const handleClaimVoucher = useCallback(async () => {
    if (!pendingVoucherStage) return;
    setClaimedVouchers(prev =>
      prev.includes(pendingVoucherStage) ? prev : [...prev, pendingVoucherStage]
    );
    const nextClaimedVouchers = claimedVouchers.includes(pendingVoucherStage)
      ? claimedVouchers
      : [...claimedVouchers, pendingVoucherStage];
    const meta = STAGE_META[pendingVoucherStage];
    addVoucher(meta.voucher.code, meta.voucher.label, meta.desc);
    setPendingVoucherStage(null);
    saveProgress({ selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers: nextClaimedVouchers, notifOn });
    if (notifOn) {
      await sendVoucherReadyNotification(meta.voucher.label, meta.label);
    }
  }, [pendingVoucherStage, notifOn, addVoucher, claimedVouchers, selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, missions, saveProgress]);

  // ── Handler: Tiếp tục trồng ───────────────────────────────────────────────
  const handleContinuePlanting = useCallback(() => {
    setPendingVoucherStage(null);
    // Timer đã tự reset khi stage thay đổi — chỉ đóng dialog
  }, []);

  // ── Handler: Bật thông báo ────────────────────────────────────────────────
  const handleToggleNotif = useCallback(async () => {
    if (!notifOn) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyWaterReminder();
        // Lên lịch thông báo sắp xong (khi còn 30 phút)
        const remaining = remainingMs - 30 * 60 * 1000;
        if (remaining > 0) {
          const meta = STAGE_META[stage < 4 ? (stage + 1) as StageKey : 4];
          const id = await scheduleStageAlmostDoneNotification(meta.label, Math.floor(remaining / 1000));
          if (id) setNotifScheduledId(id);
        }
        setNotifOn(true);
        saveProgress({ selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn: true });
      }
    } else {
      await cancelDailyWaterReminder();
      setNotifOn(false);
      saveProgress({ selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, notifOn: false });
    }
  }, [notifOn, remainingMs, stage, selectedSeed, stageStartTime, timeReduced, waterTurns, fertTurns, waterMax, fertMax, missions, claimedVouchers, saveProgress]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const meta = STAGE_META[stage];
  const isMaxStage = stage === 4;

  const totalDuration = Math.max(1000, STAGE_BASE_DURATION_MS - timeReduced);
  const timeSpentInStage = Math.max(0, totalDuration - remainingMs);
  const progressPercent = stage === 0 ? 0 : isMaxStage ? 100 : Math.min(100, Math.round((timeSpentInStage / totalDuration) * 100));

  // mỗi giai đoạn có tiến độ riêng, khi sang stage mới thì phần trăm bắt đầu lại từ 0
  const stageProgressPercent = stage === 0 ? 0 : isMaxStage ? 100 : progressPercent;

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.headerIconBox}>
              <Text style={{ fontSize: 16 }}>🌿</Text>
            </View>
            <Text style={styles.headerTitle}>Nuôi Cây Ảo</Text>
          </View>
          <Text style={styles.headerSub}>
            Chăm sóc cây mỗi ngày để nhận Voucher hấp dẫn!
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBellBtn} onPress={handleToggleNotif}>
          <Bell size={18} stroke="#fff" />
          {notifOn && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>

      {/* ── Sub Tab Bar ─────────────────────────────────────────────────── */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === "game" && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab("game")}
        >
          <Text style={[styles.subTabText, activeSubTab === "game" && styles.subTabTextActive]}>
            🌱 Nuôi Cây Ảo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === "promotions" && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab("promotions")}
        >
          <Text style={[styles.subTabText, activeSubTab === "promotions" && styles.subTabTextActive]}>
            🎁 Kho Khuyến Mãi ({collectedVouchers.length + storeCoupons.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Scrollable Content ──────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSubTab === "game" ? (
          <>
            {/* ── Plant Card ──────────────────────────────────────────────────── */}
            <View style={[styles.plantCard, { borderColor: meta.color + "22" }]}>
              {/* Stage bar */}
              <View style={[styles.stageBar, { borderBottomColor: meta.bg }]}>
                <View style={styles.stageBadgeRow}>
                  <View style={[styles.stagePulse, { backgroundColor: meta.color }]} />
                  <Text style={[styles.stageLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={[styles.stageChip, { backgroundColor: meta.color }]}>
                  <Text style={styles.stageChipText}>{stage === 0 ? "Chưa trồng" : `Dạng ${stage}/4`}</Text>
                </View>
              </View>

              {/* Desc badge */}
              <View style={[styles.descBadge, { backgroundColor: meta.bg }]}>
                <Text style={styles.descEmoji}>{meta.emoji}</Text>
                <Text style={[styles.descText, { color: meta.color }]}>{meta.desc}</Text>
              </View>

              {/* Plant SVG với breathing animation */}
              <View style={styles.plantSvgContainer}>
                <View style={[styles.plantGlow, { backgroundColor: meta.color + "18" }]} />
                <Animated.View style={[styles.plantSvgBox, { transform: [{ scale: breatheAnim }] }]}>
                  {stage === 0 ? <EmptyPotPlant onPress={() => setSeedPickerOpen(true)} /> : <PlantIllustration stage={stage} />}
                </Animated.View>
              </View>

              {/* Timer & Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {stage === 0 ? "🌱 Chậu đang chờ hạt giống" : isMaxStage ? "🌺 Cây đã nở rộ hoàn toàn!" : "⏱️ Thời gian lên giai đoạn tiếp theo"}
                  </Text>
                  <View style={styles.progressHeaderRight}>
                    <Text style={[styles.progressPercent, { color: meta.color }]}>{stageProgressPercent}%</Text>
                    {stage > 0 && !isMaxStage && (
                      <Text style={styles.stageProgressText}>GĐ {stage}/4</Text>
                    )}
                  </View>
                </View>

                {stage !== 0 && !isMaxStage && (
                  <View style={styles.timerBox}>
                    <Text style={[styles.timerText, { color: meta.color }]}>
                      {formatTime(remainingMs)}
                    </Text>
                    <Text style={styles.timerSub}>còn lại → {meta.nextLabel}</Text>
                  </View>
                )}

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressWidth,
                        backgroundColor: meta.color,
                      },
                    ]}
                  />
                </View>

                {timeReduced > 0 && (
                  <Text style={styles.reducedTimeTag}>
                    ⚡ Đã giảm {formatTime(timeReduced)} nhờ chăm sóc
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              {stage !== 0 && !isMaxStage && (
                <View style={styles.actionRow}>
                  {/* Tưới nước */}
                  <Animated.View style={[styles.actionBtnWrapper, { transform: [{ scale: waterBtnAnim }] }]}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        waterTurns <= 0 && styles.actionBtnDisabled,
                        { borderColor: waterTurns > 0 ? "#1565C040" : "#e0e0e0" },
                      ]}
                      onPress={handleWater}
                      disabled={waterTurns <= 0}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIconBox, { backgroundColor: waterTurns > 0 ? "#1565C0" : "#ccc" }]}>
                        <Droplets size={22} stroke="#fff" />
                      </View>
                      <Text style={[styles.actionLabel, { color: waterTurns > 0 ? "#1565C0" : "#bbb" }]}>
                        Tưới nước
                      </Text>
                      <Text style={styles.actionTurns}>{waterTurns}/{waterMax} lượt</Text>
                      <Text style={styles.actionEffect}>⏱ -30 phút</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Bón phân */}
                  <Animated.View style={[styles.actionBtnWrapper, { transform: [{ scale: fertBtnAnim }] }]}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        fertTurns <= 0 && styles.actionBtnDisabled,
                        { borderColor: fertTurns > 0 ? "#2E7D3240" : "#e0e0e0" },
                      ]}
                      onPress={handleFert}
                      disabled={fertTurns <= 0}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIconBox, { backgroundColor: fertTurns > 0 ? "#2E7D32" : "#ccc" }]}>
                        <Leaf size={22} stroke="#fff" />
                      </View>
                      <Text style={[styles.actionLabel, { color: fertTurns > 0 ? "#2E7D32" : "#bbb" }]}>
                        Bón phân
                      </Text>
                      <Text style={styles.actionTurns}>{fertTurns}/{fertMax} lượt</Text>
                      <Text style={styles.actionEffect}>⏱ -60 phút</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </View>

            {/* ── Voucher Rewards Section ─────────────────────────────────────── */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <View style={styles.rewardIconBox}>
                  <Gift size={16} stroke="#fff" />
                </View>
                <View>
                  <Text style={styles.rewardTitle}>Phần thưởng từng giai đoạn</Text>
                  <Text style={styles.rewardSub}>Hoàn thành mỗi giai đoạn để nhận</Text>
                </View>
              </View>

              {([1, 2, 3, 4] as StageKey[]).map((s) => {
                const sm = STAGE_META[s];
                const claimed = claimedVouchers.includes(s);
                const current = stage === s;
                const unlocked = stage > s || (stage === s && isMaxStage);
                return (
                  <View key={s} style={[
                    styles.rewardRow,
                    current && styles.rewardRowCurrent,
                    claimed && styles.rewardRowClaimed,
                  ]}>
                    <Text style={styles.rewardEmoji}>{sm.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rewardRowLabel}>{sm.label}</Text>
                      <Text style={styles.rewardRowVoucher}>{sm.voucher.label}</Text>
                    </View>
                    {claimed ? (
                      <View style={styles.rewardClaimedTag}>
                        <Text style={styles.rewardClaimedText}>Đã nhận ✓</Text>
                      </View>
                    ) : current && isMaxStage ? (
                      <TouchableOpacity
                        style={styles.rewardClaimBtn}
                        onPress={() => setPendingVoucherStage(s)}
                      >
                        <Text style={styles.rewardClaimBtnText}>Nhận</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.rewardLockTag, { opacity: unlocked ? 1 : 0.4 }]}>
                        <Text style={styles.rewardLockText}>{unlocked ? "Sẵn sàng" : "🔒 Chờ"}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* ── Đã nhận Voucher ──────────────────────────────────────────────── */}
            {claimedVouchers.length > 0 && (
              <View style={styles.claimedSection}>
                <Text style={styles.claimedTitle}>🎫 Voucher của bạn</Text>
                {claimedVouchers.map(s => (
                  <ClaimedVoucherCard key={s} stage={s} />
                ))}
              </View>
            )}

            {/* ── Missions Button ──────────────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.missionBtn}
              onPress={() => setMissionOpen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.missionBtnIcon}>
                <Star size={20} stroke="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.missionBtnTitle}>Nhiệm vụ hằng ngày</Text>
                <Text style={styles.missionBtnSub}>
                  {missions.filter(Boolean).length}/{MISSION_DATA.length} nhiệm vụ · Nhận thêm lượt tưới & bón
                </Text>
              </View>
              <View style={styles.missionDots}>
                {MISSION_DATA.map((_, i) => (
                  <View key={i} style={[styles.missionDot, { backgroundColor: missions[i] ? "#2E7D32" : "#E0E0E0" }]} />
                ))}
              </View>
              <ChevronRight size={18} stroke="#A5D6A7" />
            </TouchableOpacity>

            {/* ── Notification Card ────────────────────────────────────────────── */}
            <View style={styles.notifCard}>
              <View style={styles.notifIconBox}>
                <Bell size={20} stroke="#fff" />
              </View>
              <Text style={styles.notifText}>
                Nhận thông báo nhắc tưới cây mỗi ngày và khi cây lên giai đoạn mới!
              </Text>
              <TouchableOpacity
                style={[styles.notifToggle, { backgroundColor: notifOn ? "#2E7D32" : "#1565C0" }]}
                onPress={handleToggleNotif}
              >
                <Text style={styles.notifToggleText}>{notifOn ? "Bật ✓" : "Bật"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ── Khuyến Mãi Tab ───────────────────────────────────────────────────── */
          <View>
            {/* Voucher đã tích lũy từ cây ảo */}
            <Text style={styles.promoSectionTitle}>🎟️ Ví Voucher của bạn ({collectedVouchers.length})</Text>
            {collectedVouchers.length === 0 ? (
              <View style={styles.emptyVoucherBox}>
                <Text style={styles.emptyVoucherText}>Chưa có voucher nào. Hãy nuôi cây để đổi voucher!</Text>
              </View>
            ) : (
              collectedVouchers.map((v, idx) => (
                <View key={idx} style={styles.couponCard}>
                  <View style={styles.couponLeft}>
                    <View style={styles.couponBadge}>
                      <Text style={styles.couponBadgeText}>🌿 Đã lưu từ cây ảo</Text>
                    </View>
                    <Text style={styles.couponCodeText}>{v.code}</Text>
                    <Text style={styles.couponDesc}>{v.label} - {v.discountDesc || "Được áp dụng tại Checkout"}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyBtn, copiedCode === v.code && styles.copyBtnSuccess]}
                    onPress={() => handleCopyCode(v.code, v.label)}
                  >
                    {copiedCode === v.code ? (
                      <>
                        <CheckCircle2 size={14} stroke="#fff" />
                        <Text style={styles.copyBtnText}>Đã lấy ✓</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} stroke="#fff" />
                        <Text style={styles.copyBtnText}>Sao chép</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Khuyến mãi từ hệ thống */}
            <Text style={styles.promoSectionTitle}>🔥 Ưu Đãi Cửa Hàng</Text>
            {loadingCoupons ? (
              <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 20 }} />
            ) : storeCoupons.length === 0 ? (
              <View style={styles.emptyVoucherBox}>
                <Text style={styles.emptyVoucherText}>Hiện chưa có khuyến mãi mới.</Text>
              </View>
            ) : (
              storeCoupons.map((c) => {
                const discountText =
                  c.loai_giam_gia === "phan_tram"
                    ? `Giảm ${c.gia_tri_giam}%`
                    : `Giảm ${parseFloat(c.gia_tri_giam).toLocaleString("vi-VN")}đ`;
                const isCopied = copiedCode === c.ma_code;
                return (
                  <View key={c.id} style={styles.couponCard}>
                    <View style={styles.couponLeft}>
                      <View style={[styles.couponBadge, { backgroundColor: "#FFF3E0" }]}>
                        <Text style={[styles.couponBadgeText, { color: "#E65100" }]}>{discountText}</Text>
                      </View>
                      <Text style={styles.couponCodeText}>{c.ma_code}</Text>
                      <Text style={styles.couponDesc}>{c.mo_ta || "Áp dụng cho mọi đơn hàng"}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                      onPress={() => handleCopyCode(c.ma_code, `${discountText} (${c.ma_code})`)}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 size={14} stroke="#fff" />
                          <Text style={styles.copyBtnText}>Đã lấy ✓</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={14} stroke="#fff" />
                          <Text style={styles.copyBtnText}>Sao chép</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Voucher Dialog ──────────────────────────────────────────────────── */}
      {pendingVoucherStage && (
        <VoucherDialog
          visible={!!pendingVoucherStage}
          stage={pendingVoucherStage}
          onClaimNow={handleClaimVoucher}
          onContinue={handleContinuePlanting}
        />
      )}

      {/* ── Mission Sheet ───────────────────────────────────────────────────── */}
      <MissionSheet
        visible={missionOpen}
        missions={missions}
        onClose={() => setMissionOpen(false)}
        onClaim={handleClaimMission}
        onExplore={handleExploreMission}
      />
      <SeedInfoModal
        seed={seedInfo}
        onClose={() => setSeedInfo(null)}
        onSelect={handleSelectSeed}
      />
      <SeedPickerModal
        visible={seedPickerOpen}
        onClose={() => setSeedPickerOpen(false)}
        onSelect={handleViewSeedInfo}
        seeds={unlockedSeeds}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF7",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", maxWidth: 220 },
  headerBellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8F00",
    borderWidth: 1.5,
    borderColor: "#2E7D32",
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },

  // Plant Card
  seedSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCEBDE",
  },
  seedSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  seedSectionTitle: { fontSize: 15, fontWeight: "900", color: "#1A2E1A" },
  seedSectionSub: { fontSize: 11, color: "#6B806B", marginTop: 3 },
  seedList: { gap: 10 },
  seedCard: {
    width: 142,
    minHeight: 112,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5EDE5",
    backgroundColor: "#FAFCFA",
  },
  seedCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seedImage: { width: 52, height: 44, borderRadius: 10, resizeMode: "cover" },
  bestSellerTag: { backgroundColor: "#FFF3E0", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 3, maxWidth: 72 },
  bestSellerText: { color: "#E65100", fontSize: 8, fontWeight: "800" },
  seedName: { color: "#1A2E1A", fontSize: 12, fontWeight: "800", marginTop: 7 },
  seedPrice: { color: "#2E7D32", fontSize: 12, fontWeight: "900", marginTop: 3 },
  seedHint: { color: "#6B806B", fontSize: 10, fontWeight: "600", marginTop: 4 },
  seedModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
  seedModalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 22, alignItems: "center" },
  seedModalClose: { position: "absolute", right: 14, top: 14, padding: 6 },
  seedModalIcon: { width: 86, height: 86, borderRadius: 43, alignItems: "center", justifyContent: "center", marginTop: 8 },
  seedModalImage: { width: 76, height: 76, borderRadius: 38, resizeMode: "cover" },
  seedModalTag: { fontSize: 11, fontWeight: "800", marginTop: 12, textTransform: "uppercase" },
  seedModalTitle: { color: "#1A2E1A", fontSize: 21, fontWeight: "900", textAlign: "center", marginTop: 4 },
  seedModalDescription: { color: "#607060", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8 },
  growthTimelineTitle: { alignSelf: "flex-start", color: "#1A2E1A", fontSize: 13, fontWeight: "900", marginTop: 18, marginBottom: 10 },
  growthTimeline: { gap: 10, paddingRight: 4 },
  growthStageCard: { width: 138, backgroundColor: "#F8FBF8", borderWidth: 1, borderRadius: 14, padding: 8 },
  growthStageImageWrap: { position: "relative" },
  growthStageImage: { width: "100%", height: 78, borderRadius: 10, resizeMode: "cover" },
  growthStageNumber: { position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  growthStageNumberText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  growthStageTitle: { color: "#1A2E1A", fontSize: 11, fontWeight: "900", marginTop: 8 },
  growthStageAge: { fontSize: 10, fontWeight: "800", marginTop: 3 },
  growthStageDescription: { color: "#687568", fontSize: 10, lineHeight: 14, marginTop: 5 },
  seedDetailRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 16 },
  seedDetailBox: { flex: 1, backgroundColor: "#F5F9F5", borderRadius: 12, padding: 10 },
  seedDetailLabel: { color: "#809080", fontSize: 10, fontWeight: "700" },
  seedDetailValue: { color: "#1A2E1A", fontSize: 11, fontWeight: "800", marginTop: 4 },
  seedCareText: { alignSelf: "flex-start", color: "#4F6F4F", fontSize: 11, marginTop: 12 },
  seedSelectButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", paddingVertical: 13, borderRadius: 14, marginTop: 18 },
  seedSelectButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  emptyPotButton: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  emptyPotPlus: { position: "absolute", width: 48, height: 48, borderRadius: 24, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 5, elevation: 4 },
  emptyPotPlusText: { color: "#fff", fontSize: 32, fontWeight: "300", lineHeight: 36 },
  seedPickerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  seedPickerCard: { maxHeight: "82%", backgroundColor: "#F7FAF7", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  seedPickerHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  seedPickerTitle: { color: "#1A2E1A", fontSize: 21, fontWeight: "900" },
  seedPickerSubtitle: { color: "#6B806B", fontSize: 12, marginTop: 4 },
  seedPickerList: { gap: 10, paddingBottom: 12 },
  emptySeedInventory: { alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 24, paddingVertical: 28, borderWidth: 1, borderColor: "#E1EAE1" },
  emptySeedInventoryEmoji: { fontSize: 38 },
  emptySeedInventoryTitle: { color: "#1A2E1A", fontSize: 15, fontWeight: "900", marginTop: 10 },
  emptySeedInventoryText: { color: "#718071", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6 },
  seedPickerRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 10, borderWidth: 1, borderColor: "#E1EAE1" },
  seedPickerImage: { width: 72, height: 64, borderRadius: 12, resizeMode: "cover" },
  seedPickerInfo: { flex: 1, marginLeft: 12 },
  seedPickerName: { color: "#1A2E1A", fontSize: 14, fontWeight: "800" },
  seedPickerPrice: { color: "#2E7D32", fontSize: 13, fontWeight: "900", marginTop: 3 },
  seedPickerCare: { color: "#718071", fontSize: 10, marginTop: 3 },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  stageBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stageBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stagePulse: { width: 8, height: 8, borderRadius: 4 },
  stageLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  stageChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stageChipText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  descBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  descEmoji: { fontSize: 16 },
  descText: { fontSize: 12, fontWeight: "700", flex: 1 },

  // Plant SVG
  plantSvgContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  plantGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  plantSvgBox: { width: 200, height: 200, zIndex: 1 },

  // Progress
  progressSection: { paddingHorizontal: 20, paddingBottom: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: "700", color: "#1a2e1a", flex: 1 },
  progressHeaderRight: { alignItems: "flex-end" },
  progressPercent: { fontSize: 18, fontWeight: "900" },
  stageProgressText: { fontSize: 10, color: "#5d6b5d", fontWeight: "700", marginTop: 2 },
  timerBox: { alignItems: "center", marginBottom: 12 },
  timerText: { fontSize: 36, fontWeight: "900", letterSpacing: 2, fontVariant: ["tabular-nums"] },
  timerSub: { fontSize: 11, color: "#888", fontWeight: "600", marginTop: 2 },
  progressTrack: {
    height: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 6 },
  reducedTimeTag: { fontSize: 11, color: "#43A047", fontWeight: "700", marginTop: 8, textAlign: "right" },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  actionBtnWrapper: { flex: 1 },
  actionBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "#fafafa",
    gap: 6,
  },
  actionBtnDisabled: { backgroundColor: "#f5f5f5" },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 13, fontWeight: "800" },
  actionTurns: { fontSize: 11, color: "#666", fontWeight: "600" },
  actionEffect: { fontSize: 10, color: "#888", fontWeight: "600" },

  // Reward card
  rewardCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#FF8F00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  rewardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#FFE08244" },
  rewardIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FF8F00", alignItems: "center", justifyContent: "center" },
  rewardTitle: { fontSize: 14, fontWeight: "900", color: "#E65100" },
  rewardSub: { fontSize: 11, color: "#BF360C", fontWeight: "600" },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF8E1",
  },
  rewardRowCurrent: { backgroundColor: "#FFFDE7", marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 12 },
  rewardRowClaimed: { opacity: 0.7 },
  rewardEmoji: { fontSize: 22, width: 30, textAlign: "center" },
  rewardRowLabel: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  rewardRowVoucher: { fontSize: 11, color: "#888", fontWeight: "600", marginTop: 1 },
  rewardClaimedTag: { backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  rewardClaimedText: { fontSize: 11, fontWeight: "800", color: "#2E7D32" },
  rewardClaimBtn: { backgroundColor: "#FF8F00", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  rewardClaimBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  rewardLockTag: { backgroundColor: "#F5F5F5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  rewardLockText: { fontSize: 11, fontWeight: "600", color: "#888" },

  // Claimed vouchers
  claimedSection: { gap: 8 },
  claimedTitle: { fontSize: 14, fontWeight: "800", color: "#1a2e1a", marginBottom: 2 },
  claimedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  claimedIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  claimedLabel: { fontSize: 13, fontWeight: "800" },
  claimedCode: { fontSize: 11, color: "#666", fontWeight: "600", marginTop: 2 },
  claimedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CAF50" },

  // Mission button
  missionBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.12)",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  missionBtnIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center" },
  missionBtnTitle: { fontSize: 14, fontWeight: "800", color: "#1a2e1a" },
  missionBtnSub: { fontSize: 11, color: "#5a7a5a", fontWeight: "600", marginTop: 2 },
  missionDots: { flexDirection: "row", gap: 4, alignItems: "center" },
  missionDot: { width: 8, height: 8, borderRadius: 4 },

  // Notification card
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#EEF7FF",
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  notifIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#1565C0", alignItems: "center", justifyContent: "center" },
  notifText: { flex: 1, fontSize: 12, color: "#1a2e1a", fontWeight: "600", lineHeight: 18 },
  notifToggle: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  notifToggleText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Voucher Dialog
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  voucherDialog: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  voucherDialogHeader: { alignItems: "center", marginBottom: 16 },
  voucherDialogEmoji: { fontSize: 52, marginBottom: 8 },
  voucherDialogTitle: { fontSize: 22, fontWeight: "900", color: "#1a2e1a", textAlign: "center" },
  voucherDialogSubtitle: { fontSize: 13, color: "#666", fontWeight: "600", textAlign: "center", marginTop: 4 },
  voucherCurrentBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#FFE082",
  },
  voucherCurrentBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  voucherCurrentLabel: { fontSize: 16, fontWeight: "900", color: "#E65100" },
  voucherCode: { fontSize: 12, color: "#BF360C", fontWeight: "700", letterSpacing: 1 },
  voucherDivider: { textAlign: "center", color: "#aaa", fontSize: 12, fontWeight: "600", marginBottom: 12 },
  voucherOptionClaim: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#2E7D32",
    marginBottom: 10,
  },
  voucherOptionContinue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  voucherOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  voucherOptionText: { flex: 1 },
  voucherOptionTitle: { fontSize: 14, fontWeight: "800", color: "#2E7D32" },
  voucherOptionDesc: { fontSize: 12, color: "#666", fontWeight: "600", marginTop: 2 },

  // Mission Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  missionSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F8E9",
  },
  sheetHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 15, fontWeight: "900", color: "#1a2e1a" },
  sheetSubtitle: { fontSize: 11, color: "#5a7a5a", fontWeight: "600" },
  sheetHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetBadge: { backgroundColor: "#2E7D32", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sheetBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  sheetList: { paddingHorizontal: 20 },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F8E9",
  },
  missionIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  missionInfo: { flex: 1 },
  missionLabel: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  missionDesc: { fontSize: 11, color: "#5a7a5a", fontWeight: "600", marginTop: 2 },
  missionDoneTag: { backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  missionDoneText: { fontSize: 11, fontWeight: "800", color: "#2E7D32" },
  missionClaimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#2E7D32",
  },
  missionClaimText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12 },
  sheetCloseFullBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
  },
  sheetCloseBtnText: { color: "#2E7D32", fontWeight: "800", fontSize: 14 },

  // Sub Tab Styles
  subTabRow: {
    flexDirection: "row",
    backgroundColor: "#EDF3E8",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  subTabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7F6B",
  },
  subTabTextActive: {
    color: "#2E7D32",
    fontWeight: "700",
  },
  promoSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginTop: 16,
    marginBottom: 12,
  },
  emptyVoucherBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5EBE1",
    marginBottom: 12,
  },
  emptyVoucherText: {
    color: "#888",
    fontSize: 13,
  },
  couponCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5EBE1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  couponLeft: {
    flex: 1,
    marginRight: 12,
  },
  couponBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  couponBadgeText: {
    color: "#2E7D32",
    fontSize: 11,
    fontWeight: "700",
  },
  couponCodeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2E1A",
    letterSpacing: 0.5,
  },
  couponDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  copyBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyBtnSuccess: {
    backgroundColor: "#388E3C",
  },
  copyBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
