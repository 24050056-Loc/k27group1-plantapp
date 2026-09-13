import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  Animated,
  Keyboard,
  Modal,
  SafeAreaView,
} from "react-native";
import { Bell, Search, SlidersHorizontal, Plus, Sparkles, RotateCcw, X, ArrowLeft } from "lucide-react-native";
import { getFeaturedProducts, getProducts, searchProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { addToCart } from "../../services/cartService";
import { useAuth } from "../../context/AuthContext";
import { Product, Category } from "../../types";
import { resolveProductImage } from "../../assets/productImages";
import { STARTER_KITS, StarterKit } from "../../data/starterKits";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40; // full width trừ padding
const CARD_HEIGHT = 200;

type Props = {
  onSelectProduct: (product: Product) => void;
  onSelectCategory?: (categoryId: number) => void;
};

// ─── Starter Kit Poster Carousel ────────────────────────────────────────────
function StarterKitCarousel() {
  const { token } = useAuth();
  const [addingKitId, setAddingKitId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll mỗi 3.5 giây
  useEffect(() => {
    autoScrollTimer.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % STARTER_KITS.length;
        scrollRef.current?.scrollTo({
          x: next * CARD_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 3500);

    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, []);

  // Reset timer khi user tự cuộn
  const resetAutoScroll = () => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % STARTER_KITS.length;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 3500);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActiveIndex(index);
  };

  const handleAddToCart = async (kit: StarterKit) => {
    if (!token) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập tài khoản để thêm combo vào giỏ hàng."
      );
      return;
    }

    setAddingKitId(kit.id);
    try {
      await addToCart(token, kit.product_id, 1);
      Alert.alert(
        "🎉 Đã thêm Combo!",
        `"${kit.name}" đã được thêm vào giỏ hàng của bạn.`
      );
    } catch (err: any) {
      console.error("Lỗi khi thêm combo:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể thêm combo vào giỏ hàng.";
      Alert.alert("Lỗi", msg);
    } finally {
      setAddingKitId(null);
    }
  };

  return (
    <View style={carouselStyles.wrapper}>
      {/* Section header */}
      <View style={carouselStyles.sectionHeader}>
        <View style={carouselStyles.sectionTitleRow}>
          <Sparkles size={16} stroke="#F4A261" />
          <Text style={carouselStyles.sectionTitle}>Combo Starter Kit</Text>
        </View>
        <Text style={carouselStyles.sectionSub}>
          Tiết kiệm hơn khi mua trọn bộ 🌿
        </Text>
      </View>

      {/* Horizontal poster scroll */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={resetAutoScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={carouselStyles.scrollContent}
      >
        {STARTER_KITS.map((kit, index) => (
          <View key={kit.id} style={carouselStyles.posterCard}>
            {/* Background image */}
            <Image
              source={kit.image || { uri: kit.bgImage }}
              style={carouselStyles.posterBg}
              resizeMode="cover"
            />

            {/* Dark overlay gradient (via semi-transparent Views) */}
            <View style={carouselStyles.overlayDark} />
            <View
              style={[
                carouselStyles.overlayColor,
                { backgroundColor: kit.gradientFrom + "CC" },
              ]}
            />

            {/* Content */}
            <View style={carouselStyles.posterContent}>
              {/* Top row: tag + discount */}
              <View style={carouselStyles.topRow}>
                <View style={[carouselStyles.tagBadge, { backgroundColor: kit.tagColor }]}>
                  <Text style={carouselStyles.tagText}>{kit.tag}</Text>
                </View>
                <View style={carouselStyles.discountBadge}>
                  <Text style={carouselStyles.discountText}>-{kit.discount}%</Text>
                </View>
              </View>

              {/* Middle: emoji + title */}
              <Text style={carouselStyles.emoji}>{kit.emoji}</Text>
              <Text style={carouselStyles.kitName}>{kit.name}</Text>
              <Text style={carouselStyles.kitDesc} numberOfLines={2}>
                {kit.description}
              </Text>

              {/* Bottom row: price + CTA */}
              <View style={carouselStyles.bottomRow}>
                <View>
                  <Text style={carouselStyles.originalPrice}>
                    {kit.originalPrice.toLocaleString("vi-VN")}đ
                  </Text>
                  <Text style={carouselStyles.salePrice}>
                    {kit.salePrice.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    carouselStyles.ctaButton,
                    addingKitId === kit.id && { opacity: 0.8 },
                  ]}
                  onPress={() => handleAddToCart(kit)}
                  disabled={addingKitId === kit.id}
                >
                  {addingKitId === kit.id ? (
                    <ActivityIndicator size="small" color="#2E7D32" />
                  ) : (
                    <>
                      <Plus size={13} stroke="#2E7D32" />
                      <Text style={carouselStyles.ctaText}>Thêm vào giỏ</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={carouselStyles.dotsRow}>
        {STARTER_KITS.map((item, i) => (
          <TouchableOpacity
            key={`starter-dot-${item.id ?? i}`}
            onPress={() => {
              scrollRef.current?.scrollTo({ x: i * CARD_WIDTH, animated: true });
              setActiveIndex(i);
              resetAutoScroll();
            }}
          >
            <View
              style={[
                carouselStyles.dot,
                i === activeIndex && carouselStyles.dotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Search Helpers ─────────────────────────────────────────────────────────
function removeVietnameseTones(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

const POPULAR_SEARCH_CHIPS = [
  "Cây Sen Đá",
  "Cây Lưỡi Hổ",
  "Cây Xương Rồng",
  "Cây Bàng Đài Loan",
  "Hoa Hướng Dương",
  "Cà Chua",
  "Cây Măng Cụt",
];

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen({ onSelectProduct, onSelectCategory }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  const filterLocalProducts = (keyword: string, sourceList: Product[]) => {
    const norm = removeVietnameseTones(keyword);
    if (!norm) return [];
    return sourceList.filter((item) => {
      const nameNorm = removeVietnameseTones(item.ten_san_pham);
      const descNorm = removeVietnameseTones(item.mo_ta || "");
      const catNorm = removeVietnameseTones((item as any).category_name || "");
      return nameNorm.includes(norm) || descNorm.includes(norm) || catNorm.includes(norm);
    });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!text.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    // 1. Gợi ý TỨC THÌ từ danh mục toàn bộ cây của trang sản phẩm (allProducts)
    const pool = allProducts.length > 0 ? allProducts : products;
    const instantMatches = filterLocalProducts(text, pool);
    setSearchResults(instantMatches);

    // 2. Gọi thêm API backend để đồng bộ kết quả mới nhất
    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const apiResults = await searchProducts(text);
        if (apiResults && apiResults.length > 0) {
          const idMap = new Map<number, Product>();
          apiResults.forEach((p) => idMap.set(p.id, p));
          instantMatches.forEach((p) => {
            if (!idMap.has(p.id)) idMap.set(p.id, p);
          });
          setSearchResults(Array.from(idMap.values()));
        }
      } catch (e) {
        // Đã có kết quả instantMatches hiển thị ngay cho khách hàng
      } finally {
        setSearching(false);
      }
    }, 280);
  };

  const handleOpenSearch = () => {
    setSearchActive(true);
  };

  const handleCloseSearch = () => {
    Keyboard.dismiss();
    setSearchActive(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleQuickChipPress = (keyword: string) => {
    setSearchActive(true);
    handleSearchChange(keyword);
  };

  const handleSelectSuggestion = (product: Product) => {
    Keyboard.dismiss();
    setSearchActive(false);
    setSearchQuery("");
    setSearchResults([]);
    onSelectProduct(product);
  };

  // ─── Daily Greeting ────────────────────────────────────────────────────────
  const { user } = useAuth();
  const [greetingVisible, setGreetingVisible] = useState(false);
  const greetingFadeAnim = useRef(new Animated.Value(0)).current;
  const greetingScaleAnim = useRef(new Animated.Value(0.85)).current;
  const [bellHasDot, setBellHasDot] = useState(true);

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        emoji: "☀️",
        time: "Buổi sáng",
        title: "Chào buổi sáng!",
        message: "Hãy bắt đầu ngày mới bằng cách tưới cây và chăm sóc khu vườn xanh của bạn nhé!",
        tip: "💡 Mẹo hôm nay: Tưới cây vào sáng sớm giúp rễ hấp thụ nước tốt hơn và tránh bốc hơi.",
        bgColor: "#FFF8E1",
        accentColor: "#F57F17",
        gradient: "#FFE082",
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        emoji: "🌤️",
        time: "Buổi chiều",
        title: "Chào buổi chiều!",
        message: "Một buổi chiều tuyệt vời để kiểm tra và chăm sóc khu vườn yêu thích của bạn!",
        tip: "💡 Mẹo hôm nay: Buổi chiều là lúc tốt để bón phân cho cây, tránh ánh nắng gay gắt.",
        bgColor: "#E8F5E9",
        accentColor: "#2E7D32",
        gradient: "#A5D6A7",
      };
    } else {
      return {
        emoji: "🌙",
        time: "Buổi tối",
        title: "Chào buổi tối!",
        message: "Đừng quên tưới nước cho cây trước khi nghỉ ngơi. Một giấc ngủ ngon chờ đón bạn!",
        tip: "💡 Mẹo hôm nay: Buổi tối là thời điểm lý tưởng để kiểm tra độ ẩm đất.",
        bgColor: "#EDE7F6",
        accentColor: "#4527A0",
        gradient: "#B39DDB",
      };
    }
  };

  const handleOpenGreeting = () => {
    setBellHasDot(false);
    setGreetingVisible(true);
    greetingFadeAnim.setValue(0);
    greetingScaleAnim.setValue(0.85);
    Animated.parallel([
      Animated.timing(greetingFadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(greetingScaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const handleCloseGreeting = () => {
    Animated.parallel([
      Animated.timing(greetingFadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(greetingScaleAnim, { toValue: 0.9, duration: 180, useNativeDriver: true }),
    ]).start(() => setGreetingVisible(false));
  };

  const greetingData = getGreetingData();
  const greetingHeader = greetingData.time === "Buổi sáng"
    ? "Chào buổi sáng ☀️"
    : greetingData.time === "Buổi chiều"
    ? "Chào buổi chiều 🌤️"
    : "Chào buổi tối 🌙";

  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, catList, fullCatalog] = await Promise.all([
          getFeaturedProducts(),
          getCategories(),
          getProducts().catch(() => []),
        ]);
        setProducts(prodList);
        setCategories(catList);
        setAllProducts(fullCatalog);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getProductImageSource = (urlPath: string | null | undefined) =>
    resolveProductImage(urlPath);

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("combo") || lower.includes("kit")) return "🎁";
    if (lower.includes("chậu")) return "🪴";
    if (lower.includes("giống") || lower.includes("mầm")) return "🌱";
    if (lower.includes("cảnh") || lower.includes("trong nhà")) return "🌿";
    if (lower.includes("ngoài trời")) return "🌳";
    if (lower.includes("hoa")) return "🌸";
    return "🍃";
  };
  const reloadData = async () => {
    try {
      setLoading(true);
      const [prodList, catList, fullCatalog] = await Promise.all([
        getFeaturedProducts(),
        getCategories(),
        getProducts().catch(() => []),
      ]);
      setProducts(prodList);
      setCategories(catList);
      setAllProducts(fullCatalog);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu trang chủ:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image
            source={require("../../../assets/LogoPlantApp.png")}
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <View>
            <Text style={styles.greeting}>{greetingHeader}</Text>
            <Text style={styles.title}>Plantify</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.iconButton} onPress={reloadData}>
            <RotateCcw size={18} stroke="#1A2E1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleOpenGreeting}>
            <Bell size={20} stroke="#1A2E1A" />
            {bellHasDot && (
              <View style={styles.bellDot} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar on Home Screen - Bấm để mở giao diện tìm kiếm mở rộng */}
      <View style={styles.searchWrapper}>
        <TouchableOpacity
          style={styles.searchRow}
          activeOpacity={0.88}
          onPress={handleOpenSearch}
        >
          <Search size={18} stroke="#2E7D32" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholderText}>
            {searchQuery.trim() ? searchQuery : "Tìm cây cảnh, sen đá, xương rồng..."}
          </Text>
          <View style={styles.filterButton}>
            <SlidersHorizontal size={16} stroke="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 🔍 Giao diện tìm kiếm mở rộng toàn màn hình (Kéo thả ga & Bấm chuyển trang ngay) */}
      <Modal
        visible={searchActive}
        animationType="fade"
        transparent={false}
        onRequestClose={handleCloseSearch}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          {/* Top Bar với nút Quay lại và ô nhập */}
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              style={styles.searchBackBtn}
              onPress={handleCloseSearch}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} stroke="#1A2E1A" />
            </TouchableOpacity>

            <View style={styles.searchModalInputWrapper}>
              <Search size={18} stroke="#2E7D32" style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                autoFocus={true}
                placeholder="Tìm cây cảnh, sen đá, xương rồng..."
                placeholderTextColor="#AAA"
                style={styles.searchModalInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchResults.length > 0) {
                    handleSelectSuggestion(searchResults[0]);
                  }
                }}
              />
              {searching && (
                <ActivityIndicator size="small" color="#2E7D32" style={{ marginRight: 6 }} />
              )}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearchChange("")}
                  style={styles.clearButton}
                >
                  <X size={18} stroke="#888" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Vùng danh sách kết quả tìm kiếm - Cuộn/kéo mở rộng toàn màn hình */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.searchModalScrollContent}
          >
            {searchQuery.trim().length === 0 ? (
              // Khi chưa nhập từ khóa: Gợi ý các cây tìm kiếm phổ biến
              <View style={styles.quickSearchSection}>
                <View style={styles.quickSearchTitleRow}>
                  <Sparkles size={16} stroke="#2E7D32" />
                  <Text style={styles.quickSearchTitle}>Gợi ý cây cảnh phổ biến:</Text>
                </View>
                <View style={styles.chipsWrap}>
                  {POPULAR_SEARCH_CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={styles.chipPill}
                      onPress={() => handleQuickChipPress(chip)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : searchResults.length === 0 && !searching ? (
              // Khi không tìm thấy kết quả
              <View style={styles.searchEmptySection}>
                <Text style={styles.searchEmptyEmoji}>🌱</Text>
                <Text style={styles.searchEmptyTitle}>
                  Không tìm thấy cây cho "{searchQuery}"
                </Text>
                <Text style={styles.searchEmptySub}>
                  Thử tìm kiếm với từ khóa: Sen đá, Lưỡi hổ, Xương rồng, Bàng đài loan...
                </Text>
              </View>
            ) : (
              // Danh sách tất cả sản phẩm tìm thấy từ trang sản phẩm
              <View style={styles.searchResultsSection}>
                <View style={styles.resultsHeaderRow}>
                  <Text style={styles.resultsHeaderText}>
                    {searching
                      ? "Đang tìm kiếm..."
                      : `Tìm thấy ${searchResults.length} cây cảnh phù hợp:`}
                  </Text>
                </View>

                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultCard}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={resolveProductImage(item.hinh_anh_url)}
                      style={styles.searchResultImage}
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>
                        {item.ten_san_pham}
                      </Text>
                      {item.ten_khoa_hoc ? (
                        <Text style={styles.searchResultScientific} numberOfLines={1}>
                          {item.ten_khoa_hoc}
                        </Text>
                      ) : null}
                      <View style={styles.searchResultMetaRow}>
                        <Text style={styles.searchResultPrice}>
                          {parseFloat(item.gia_tien).toLocaleString("vi-VN")}đ
                        </Text>
                        <View style={styles.searchResultBadge}>
                          <Text style={styles.searchResultBadgeText}>
                            {(item as any).category_name || "🌿 Cây cảnh"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.searchResultArrow}>
                      <Text style={styles.searchResultArrowText}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ★ Starter Kit Carousel */}
      <StarterKitCarousel />

      {/* Greeting Modal */}
      {greetingVisible && (
        <Animated.View
          style={[
            greetingStyles.overlay,
            { opacity: greetingFadeAnim }
          ]}
        >
          <TouchableOpacity
            style={greetingStyles.backdrop}
            activeOpacity={1}
            onPress={handleCloseGreeting}
          />
          <Animated.View
            style={[
              greetingStyles.card,
              { backgroundColor: greetingData.bgColor },
              { transform: [{ scale: greetingScaleAnim }] }
            ]}
          >
            {/* Decorative top strip */}
            <View style={[greetingStyles.topStrip, { backgroundColor: greetingData.gradient }]} />

            {/* Emoji large */}
            <Text style={greetingStyles.bigEmoji}>{greetingData.emoji}</Text>

            {/* Title */}
            <Text style={[greetingStyles.title, { color: greetingData.accentColor }]}>
              {greetingData.title}
            </Text>

            {/* Personalized sub */}
            {user && (
              <Text style={greetingStyles.userName}>
                Xin chào, {user.ho_ten || user.ten_dang_nhap || "bạn"} 🌱
              </Text>
            )}

            {/* Message */}
            <Text style={greetingStyles.message}>{greetingData.message}</Text>

            {/* Daily tip */}
            <View style={[greetingStyles.tipBox, { borderColor: greetingData.accentColor + "40" }]}>
              <Text style={[greetingStyles.tipText, { color: greetingData.accentColor }]}>
                {greetingData.tip}
              </Text>
            </View>

            {/* Time badge */}
            <View style={[greetingStyles.timeBadge, { backgroundColor: greetingData.accentColor }]}>
              <Text style={greetingStyles.timeBadgeText}>
                {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={[greetingStyles.closeBtn, { backgroundColor: greetingData.accentColor }]}
              onPress={handleCloseGreeting}
            >
              <Text style={greetingStyles.closeBtnText}>Bắt đầu ngày mới! 🌿</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {/* Categories */}
      <Text style={styles.sectionTitle}>Danh mục cây</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.categoryCard}
            onPress={() => onSelectCategory && onSelectCategory(item.id)}
          >
            <Text style={styles.categoryIcon}>{getCategoryIcon(item.ten_danh_muc)}</Text>
            <Text style={styles.categoryText} numberOfLines={1}>
              {item.ten_danh_muc}
            </Text>
          </TouchableOpacity>
        ))}
        {categories.length === 0 && !loading && (
          <Text style={styles.emptyText}>Không tìm thấy danh mục</Text>
        )}
      </ScrollView>

      {/* Best Sellers */}
      <Text style={styles.sectionTitle}>Bán chạy nhất 🔥</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.productsRow}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => onSelectProduct(product)}
            >
              <Image
                source={getProductImageSource(product.hinh_anh_url)}
                style={styles.productImage}
              />
              <Text style={styles.productName} numberOfLines={1}>
                {product.ten_san_pham}
              </Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>
                  {parseFloat(product.gia_tien).toLocaleString("vi-VN")}đ
                </Text>
                <View style={styles.addButton}>
                  <Plus size={14} stroke="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {products.length === 0 && (
            <Text style={styles.emptyText}>Không có sản phẩm nào bán chạy</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Carousel Styles ──────────────────────────────────────────────────────────
const carouselStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginLeft: 6,
  },
  sectionSub: {
    fontSize: 12,
    color: "#6B7F6B",
    marginLeft: 2,
  },
  scrollContent: {
    gap: 0,
  },
  posterCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 0,
    position: "relative",
  },
  posterBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayColor: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  posterContent: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  discountBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  emoji: {
    fontSize: 28,
    marginTop: -4,
    marginBottom: 2,
  },
  kitName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  kitDesc: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  originalPrice: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  salePrice: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 3,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C8D8C8",
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2E7D32",
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 52, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  greeting: { color: "#888", fontSize: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1A2E1A", marginTop: 4 },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    position: "relative",
    zIndex: 100,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E8F5E9",
  },
  searchIcon: { marginRight: 8 },
  searchPlaceholderText: { flex: 1, fontSize: 14, color: "#888" },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterButton: {
    width: 36,
    height: 36,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 10,
  },
  searchBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchModalInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A2E1A",
  },
  searchModalScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 60,
  },
  quickSearchSection: {
    marginBottom: 20,
  },
  quickSearchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  quickSearchTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipPill: {
    backgroundColor: "#F1F8F1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  chipText: {
    fontSize: 13,
    color: "#1B5E20",
    fontWeight: "600",
  },
  searchEmptySection: {
    padding: 40,
    alignItems: "center",
  },
  searchEmptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 6,
  },
  searchEmptySub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  searchResultsSection: {
    flex: 1,
  },
  resultsHeaderRow: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resultsHeaderText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchResultImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    marginRight: 14,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 2,
  },
  searchResultScientific: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#888",
    marginBottom: 4,
  },
  searchResultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  searchResultPrice: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "700",
  },
  searchResultBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchResultBadgeText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
  },
  searchResultArrow: {
    paddingLeft: 8,
  },
  searchResultArrowText: {
    fontSize: 24,
    color: "#CCC",
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E1A",
    marginBottom: 14,
    marginTop: 18,
  },
  categoriesRow: { flexDirection: "row", gap: 12, paddingBottom: 10 },
  categoryCard: {
    width: 90,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  categoryIcon: { fontSize: 24 },
  categoryText: { marginTop: 8, fontSize: 12, color: "#666", paddingHorizontal: 4 },
  productsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 16,
  },
  productImage: {
    width: "100%",
    height: 112,
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
  },
  productName: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#333" },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  productPrice: { fontSize: 14, fontWeight: "bold", color: "#2E7D32" },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: "#888", width: "100%", textAlign: "center", marginVertical: 10 },
  bellDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
});

// ─── Greeting Modal Styles ────────────────────────────────────────────────────────
const greetingStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  topStrip: {
    height: 6,
    width: "100%",
  },
  bigEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.3,
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 14,
    paddingHorizontal: 24,
  },
  tipBox: {
    margin: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  timeBadge: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  timeBadgeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  closeBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
