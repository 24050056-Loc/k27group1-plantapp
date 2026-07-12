import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions
} from "react-native";
import { HomeScreen, MallScreen, ExploreScreen, EventScreen, ProfileScreen } from "./(tabs)";
import SplashScreen from "./(auth)/splash";
import LoginScreen from "./(auth)/login";
import RegisterScreen from "./(auth)/register";
import CartScreen from "./(cart)/Cart";
import CheckoutScreen from "./(checkout)/Checkout";
import PaymentCODScreen from "./(payment)/PaymentCOD";
import PaymentQRScreen from "./(payment)/PaymentQR";
import ProductDetailScreen from "./(product)/ProductDetail";
import OrderDetailScreen from "./(order)/OrderDetail";
import {
  Home as HomeIcon,
  Compass as CompassIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  ShoppingBag as ShoppingBagIcon,
} from "lucide-react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { QueryProvider } from "./QueryProvider";
import { Product } from "../types";

const windowSize = Dimensions.get("window");
const screenSize = Dimensions.get("screen");
const BOTTOM_TAB_HEIGHT = 64;
const ANDROID_BOTTOM_INSET =
  Platform.OS === "android"
    ? Math.max(28, screenSize.height - windowSize.height - (StatusBar.currentHeight ?? 0))
    : 0;
const SCROLL_BOTTOM_PADDING = BOTTOM_TAB_HEIGHT + ANDROID_BOTTOM_INSET + 28;

const TAB_ITEMS = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "mall", label: "Mall", icon: ShoppingBagIcon },
  { key: "explore", label: "Khám Phá", icon: CompassIcon },
  { key: "event", label: "Sự kiện", icon: CalendarIcon },
  { key: "profile", label: "Profile", icon: UserIcon }
] as const;

type TabKey = (typeof TAB_ITEMS)[number]["key"];
type ScreenKey =
  | "splash"
  | "login"
  | "register"
  | "home"
  | "mall"
  | "explore"
  | "event"
  | "profile"
  | "cart"
  | "checkout"
  | "paymentCOD"
  | "paymentQR"
  | "productDetail"
  | "orderDetail";

// ==========================================
// 🛠️ DEV CONFIG
// ==========================================
const DEV_MODE = false; // Tắt DEV Mode để bắt buộc đăng nhập
const DEV_INITIAL_SCREEN: ScreenKey = "splash"; // Màn hình khởi đầu
// ==========================================

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryProvider>
  );
}

function AppContent() {
  const { token, login, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenKey>(DEV_MODE ? DEV_INITIAL_SCREEN : "splash");
  const [activeTab, setActiveTab] = useState<TabKey>(
    DEV_MODE && ["home", "mall", "explore", "event", "profile"].includes(DEV_INITIAL_SCREEN)
      ? (DEV_INITIAL_SCREEN as TabKey)
      : "home"
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Auto-login giả lập cho FE khi bật DEV_MODE
  React.useEffect(() => {
    if (DEV_MODE && !token) {
      login("dev-bypass-token-12345", {
        id: 999,
        ten_dang_nhap: "developer",
        email: "dev@plantapp.com",
        ho_ten: "Developer Mode User",
        vai_tro: "USER",
      });
    }
  }, [token]);

  const goToMain = () => {
    setActiveTab("home");
    setScreen("home");
  };

  const goToAuth = (screenName: "login" | "register") => setScreen(screenName);

  const handleSelectProduct = (product: Product, fromScreen: ScreenKey) => {
    setSelectedProduct(product);
    setScreen("productDetail");
  };

  const handleCheckoutSuccess = (orderId: number) => {
    setActiveOrderId(orderId);
    setScreen("checkout"); // Vẫn ở checkout nhưng sẽ dẫn tới COD hoặc QR
  };

  const handleLogout = () => {
    logout();
    setScreen("login");
  };

  const renderMainContent = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onSelectProduct={(p) => handleSelectProduct(p, "home")} />;
      case "mall":
        return <MallScreen onSelectProduct={(p) => handleSelectProduct(p, "mall")} onOpenCart={() => setScreen("cart")} />;
      case "explore":
        return <ExploreScreen />;
      case "event":
        return <EventScreen />;
      case "profile":
        return <ProfileScreen onLogout={handleLogout} onSelectOrder={(orderId) => { setSelectedOrderId(orderId); setScreen("orderDetail"); }} />;
      case "cart":
        return <CartScreen onBack={() => setScreen("mall")} onCheckout={() => setScreen("checkout")} />;
      case "checkout":
        return (
          <CheckoutScreen
            onBack={() => setScreen("cart")}
            onCheckoutSuccess={handleCheckoutSuccess}
            onChooseCOD={() => setScreen("paymentCOD")}
            onChooseQR={() => setScreen("paymentQR")}
          />
        );
      case "paymentCOD":
        return <PaymentCODScreen orderId={activeOrderId} onBack={goToMain} />;
      case "paymentQR":
        return <PaymentQRScreen orderId={activeOrderId} onBack={goToMain} />;
      case "productDetail":
        return (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setScreen(activeTab)}
          />
        );
      case "orderDetail":
        return (
          <OrderDetailScreen
            orderId={selectedOrderId || 0}
            onBack={() => setScreen("profile")}
          />
        );
      default:
        return null;
    }
  };

  const isMainScreen = ["home", "mall", "explore", "event", "profile", "cart", "checkout", "paymentCOD", "paymentQR", "productDetail", "orderDetail"].includes(screen);

  // Màn hình tự quản lý scroll riêng — không cần ScrollView bọc ngoài
  const isFullscreenScreen = ["cart", "checkout", "paymentCOD", "paymentQR", "productDetail", "orderDetail"].includes(screen);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {screen === "splash" && (
        <SplashScreen onFinish={() => setScreen("login")} />
      )}
      {screen === "login" && (
        <LoginScreen onLogin={goToMain} onGoRegister={() => goToAuth("register")} />
      )}
      {screen === "register" && (
        <RegisterScreen onRegister={goToMain} onGoLogin={() => goToAuth("login")} />
      )}
      {isMainScreen && (
        <>
          {isFullscreenScreen ? (
            // Các màn hình fullscreen tự cuộn riêng
            <View style={styles.fullscreenContent}>
              {renderMainContent()}
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {renderMainContent()}
            </ScrollView>
          )}
          
          {/* Chỉ hiển thị Bottom Tab nếu không ở các màn hình phụ như ProductDetail, Cart, Checkout, Payment */}
          {["home", "mall", "explore", "event", "profile"].includes(screen) && (
            <View style={styles.bottomTabBar}>
              {TAB_ITEMS.map((tab) => {
                const IconComponent = tab.icon;
                const isFocused = activeTab === tab.key && screen === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => {
                      setActiveTab(tab.key);
                      setScreen(tab.key);
                    }}
                    style={styles.tabItem}
                  >
                    <IconComponent size={22} stroke={isFocused ? "#2E7D32" : "#888888"} />
                    <Text style={[styles.tabLabel, { color: isFocused ? "#2E7D32" : "#888888", fontWeight: isFocused ? "700" : "400" }]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { paddingBottom: SCROLL_BOTTOM_PADDING },
  fullscreenContent: { flex: 1 },
  bottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_TAB_HEIGHT + ANDROID_BOTTOM_INSET,
    paddingBottom: ANDROID_BOTTOM_INSET,
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  tabItem: { alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 11, marginTop: 4 },
});
