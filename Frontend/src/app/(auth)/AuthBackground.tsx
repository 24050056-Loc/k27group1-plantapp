import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import Svg, { Path, G, Defs, LinearGradient, Stop, Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Logo Google vector 4 màu chuẩn chính hãng
export function GoogleLogoIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.27A7.03 7.03 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </Svg>
  );
}

// Logo PlantApp chính thức
export function PlantifyLogoCircle({ size = 76 }: { size?: number }) {
  return (
    <View style={[styles.circleWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={require("../../../assets/LogoPlantApp.png")}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
}

// Header Logo & Tên thương hiệu Plantify
export function AuthHeader() {
  return (
    <View style={styles.headerContainer}>
      <PlantifyLogoCircle size={78} />
      <Text style={styles.brandTitle}>Plantify</Text>
      <Text style={styles.brandSubtitle}>Mang thiên nhiên vào không gian sống</Text>
    </View>
  );
}

// Họa tiết những chiếc lá trôi lơ lửng góc trên
export function FloatingLeavesTop() {
  return (
    <View style={styles.floatingLeavesWrapper} pointerEvents="none">
      {/* Cụm lá bên trái */}
      <Svg width={70} height={160} viewBox="0 0 70 160" style={styles.leafLeft}>
        <Path
          d="M-10 20 C15 15, 30 35, 20 60 C5 65, -10 50, -10 20 Z"
          fill="#A8D5A3"
          opacity={0.65}
        />
        <Path
          d="M-5 95 C12 85, 26 100, 18 120 C5 125, -8 115, -5 95 Z"
          fill="#89C483"
          opacity={0.5}
        />
      </Svg>

      {/* Cụm lá bên phải */}
      <Svg width={70} height={160} viewBox="0 0 70 160" style={styles.leafRight}>
        <Path
          d="M80 30 C55 25, 40 45, 50 70 C65 75, 80 60, 80 30 Z"
          fill="#A8D5A3"
          opacity={0.65}
        />
        <Path
          d="M75 105 C58 95, 44 110, 52 130 C65 135, 78 125, 75 105 Z"
          fill="#89C483"
          opacity={0.5}
        />
      </Svg>
    </View>
  );
}

// Bụi cây lá xanh phong phú ở chân màn hình (Bottom Foliage)
export function BottomFoliage() {
  return (
    <View style={styles.bottomFoliageWrapper} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={130} viewBox={`0 0 ${SCREEN_WIDTH} 130`}>
        <Defs>
          <LinearGradient id="foliageGrad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#8CCB86" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#6EAE68" stopOpacity={0.95} />
          </LinearGradient>
          <LinearGradient id="foliageGrad2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#4E9748" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#316F2C" stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="foliageGrad3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#255A20" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#184314" stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Lớp đồi cong nền nhạt nhất phía sau */}
        <Path
          d={`M0 90 Q${SCREEN_WIDTH * 0.25} 55, ${SCREEN_WIDTH * 0.5} 75 T${SCREEN_WIDTH} 70 L${SCREEN_WIDTH} 130 L0 130 Z`}
          fill="url(#foliageGrad1)"
        />

        {/* Cụm lá xanh bên góc trái */}
        <G fill="url(#foliageGrad2)">
          {/* Lá trái 1 */}
          <Path d="M-15 130 C-10 60, 35 45, 45 75 C35 110, 10 130, -15 130 Z" />
          {/* Lá trái 2 */}
          <Path d="M15 130 C25 70, 75 60, 80 90 C65 115, 35 130, 15 130 Z" />
        </G>

        <G fill="url(#foliageGrad3)">
          {/* Lá trái 3 (đậm nhất, cận cảnh) */}
          <Path d="M0 130 C5 80, 50 70, 55 100 C40 125, 20 130, 0 130 Z" />
          <Path d="M30 130 C45 90, 85 85, 90 110 C75 125, 50 130, 30 130 Z" />
        </G>

        {/* Cụm lá xanh bên góc phải */}
        <G fill="url(#foliageGrad2)">
          {/* Lá phải 1 */}
          <Path d={`M${SCREEN_WIDTH + 15} 130 C${SCREEN_WIDTH + 10} 60, ${SCREEN_WIDTH - 35} 45, ${SCREEN_WIDTH - 45} 75 C${SCREEN_WIDTH - 35} 110, ${SCREEN_WIDTH - 10} 130, ${SCREEN_WIDTH + 15} 130 Z`} />
          {/* Lá phải 2 */}
          <Path d={`M${SCREEN_WIDTH - 15} 130 C${SCREEN_WIDTH - 25} 70, ${SCREEN_WIDTH - 75} 60, ${SCREEN_WIDTH - 80} 90 C${SCREEN_WIDTH - 65} 115, ${SCREEN_WIDTH - 35} 130, ${SCREEN_WIDTH - 15} 130 Z`} />
        </G>

        <G fill="url(#foliageGrad3)">
          {/* Lá phải 3 (đậm nhất, cận cảnh) */}
          <Path d={`M${SCREEN_WIDTH} 130 C${SCREEN_WIDTH - 5} 80, ${SCREEN_WIDTH - 50} 70, ${SCREEN_WIDTH - 55} 100 C${SCREEN_WIDTH - 40} 125, ${SCREEN_WIDTH - 20} 130, ${SCREEN_WIDTH} 130 Z`} />
          <Path d={`M${SCREEN_WIDTH - 30} 130 C${SCREEN_WIDTH - 45} 90, ${SCREEN_WIDTH - 85} 85, ${SCREEN_WIDTH - 90} 110 C${SCREEN_WIDTH - 75} 125, ${SCREEN_WIDTH - 50} 130, ${SCREEN_WIDTH - 30} 130 Z`} />
        </G>

        {/* Khóm lá nhỏ trung tâm */}
        <Path
          d={`M${SCREEN_WIDTH * 0.5 - 25} 130 C${SCREEN_WIDTH * 0.5 - 20} 100, ${SCREEN_WIDTH * 0.5 + 5} 95, ${SCREEN_WIDTH * 0.5 + 10} 115 C${SCREEN_WIDTH * 0.5 - 5} 125, ${SCREEN_WIDTH * 0.5 - 15} 130, ${SCREEN_WIDTH * 0.5 - 25} 130 Z`}
          fill="url(#foliageGrad2)"
        />
        <Path
          d={`M${SCREEN_WIDTH * 0.5} 130 C${SCREEN_WIDTH * 0.5 + 10} 98, ${SCREEN_WIDTH * 0.5 + 30} 95, ${SCREEN_WIDTH * 0.5 + 35} 118 C${SCREEN_WIDTH * 0.5 + 20} 125, ${SCREEN_WIDTH * 0.5 + 10} 130, ${SCREEN_WIDTH * 0.5} 130 Z`}
          fill="url(#foliageGrad3)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  circleWrapper: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A5726",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    paddingBottom: 22,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#184319",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13.5,
    color: "#4A6B48",
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
  },
  floatingLeavesWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 0,
  },
  leafLeft: {
    position: "absolute",
    top: 20,
    left: 0,
  },
  leafRight: {
    position: "absolute",
    top: 20,
    right: 0,
  },
  bottomFoliageWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});
