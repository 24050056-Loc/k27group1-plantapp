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
import LoginScreen from "./(auth)/login";
import RegisterScreen from "./(auth)/register";
import CartScreen from "./(cart)/Cart";
import CheckoutScreen from "./(checkout)/Checkout";
import PaymentCODScreen from "./(payment)/PaymentCOD";
import PaymentQRScreen from "./(payment)/PaymentQR";
import ProductDetailScreen from "./(product)/ProductDetail";
import {
  Home as HomeIcon,
  Compass as CompassIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  ShoppingBag as ShoppingBagIcon,
} from "lucide-react-native";

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
  | "productDetail";

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>("login");
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  const goToMain = () => {
    setActiveTab("home");
    setScreen("home");
  };

  const goToAuth = (screenName: "login" | "register") => setScreen(screenName);

  const renderMainContent = () => {
    switch (screen) {
      case "home":
        return <HomeScreen />;
      case "mall":
        return <MallScreen />;
      case "explore":
        return <ExploreScreen />;
      case "event":
        return <EventScreen />;
      case "profile":
        return <ProfileScreen />;
      case "cart":
        return <CartScreen onBack={() => setScreen("mall")} onCheckout={() => setScreen("checkout")} />;
      case "checkout":
        return (
          <CheckoutScreen
            onBack={() => setScreen("cart")}
            onChooseCOD={() => setScreen("paymentCOD")}
            onChooseQR={() => setScreen("paymentQR")}
          />
        );
      case "paymentCOD":
        return <PaymentCODScreen onBack={() => setScreen("checkout")} />;
      case "paymentQR":
        return <PaymentQRScreen onBack={() => setScreen("checkout")} />;
      case "productDetail":
        return <ProductDetailScreen onBack={() => setScreen("home")} />;
      default:
        return null;
    }
  };

  const isMainScreen = ["home", "mall", "explore", "event", "profile", "cart", "checkout", "paymentCOD", "paymentQR", "productDetail"].includes(screen);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {screen === "login" && (
        <LoginScreen onLogin={goToMain} onGoRegister={() => goToAuth("register")} />
      )}
      {screen === "register" && (
        <RegisterScreen onRegister={goToMain} onGoLogin={() => goToAuth("login")} />
      )}
      {isMainScreen && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {renderMainContent()}
          </ScrollView>
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { paddingBottom: SCROLL_BOTTOM_PADDING },
  bottomTabBar: {
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
