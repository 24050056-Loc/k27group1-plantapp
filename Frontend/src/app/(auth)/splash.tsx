import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, ActivityIndicator, StatusBar } from "react-native";

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Chạy song song hiệu ứng fade-in và scale logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Giữ màn hình chào 2.2 giây rồi kết thúc để vào màn Login
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1b5e20" />
      
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconCircle}>
          <Text style={styles.logoIcon}>🌿</Text>
        </View>
        <Text style={styles.title}>Plantify</Text>
        <Text style={styles.subtitle}>Mang thiên nhiên vào không gian sống</Text>
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#ffffff" style={styles.loader} />
        <Text style={styles.footerText}>Đang tải cấu hình ứng dụng...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#1b5e20", // Xanh lá cây đậm cao cấp
    justifyContent: "center", 
    alignItems: "center", 
    padding: 24 
  },
  logoContainer: { 
    alignItems: "center", 
    justifyContent: "center" 
  },
  iconCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "rgba(255,255,255,0.15)", 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 20 
  },
  logoIcon: { 
    fontSize: 56 
  },
  title: { 
    fontSize: 36, 
    fontWeight: "bold", 
    color: "#ffffff", 
    letterSpacing: 1 
  },
  subtitle: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.75)", 
    marginTop: 8, 
    fontWeight: "500" 
  },
  footer: { 
    position: "absolute", 
    bottom: 50, 
    alignItems: "center" 
  },
  loader: { 
    marginBottom: 10 
  },
  footerText: { 
    fontSize: 12, 
    color: "rgba(255,255,255,0.6)", 
    fontWeight: "500" 
  }
});
