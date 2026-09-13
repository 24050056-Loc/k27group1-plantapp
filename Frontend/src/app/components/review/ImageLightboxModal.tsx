import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Animated,
  PanResponder,
  StatusBar
} from "react-native";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

type ImageLightboxModalProps = {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
};

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      slideAnim.setValue(0);
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true
        })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible, initialIndex]);

  // Swipe gesture for navigation between images
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => {
        slideAnim.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          // Swipe Left → Next
          Animated.timing(slideAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true
          }).start(() => {
            setCurrentIndex((prev) => {
              const next = Math.min(prev + 1, images.length - 1);
              slideAnim.setValue(0);
              return next;
            });
          });
        } else if (gs.dx > SWIPE_THRESHOLD) {
          // Swipe Right → Prev
          Animated.timing(slideAnim, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true
          }).start(() => {
            setCurrentIndex((prev) => {
              const next = Math.max(prev - 1, 0);
              slideAnim.setValue(0);
              return next;
            });
          });
        } else {
          // Snap back
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: SCREEN_WIDTH * 0.15, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => setCurrentIndex((p) => p - 1));
  };

  const handleNext = () => {
    if (currentIndex >= images.length - 1) return;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -SCREEN_WIDTH * 0.15, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => setCurrentIndex((p) => p + 1));
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 180, useNativeDriver: true })
    ]).start(onClose);
  };

  if (!visible || !images || images.length === 0) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <StatusBar hidden />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>

            <View style={{ width: 44 }} />
          </Animated.View>

          {/* Main Image with swipe */}
          <Animated.View
            style={[
              styles.imageContainer,
              {
                transform: [
                  { translateX: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: images[currentIndex] }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <View style={styles.navOverlay} pointerEvents="box-none">
              {currentIndex > 0 && (
                <TouchableOpacity style={[styles.navButton, styles.leftNav]} onPress={handlePrev}>
                  <ChevronLeft size={28} color="#FFF" />
                </TouchableOpacity>
              )}
              {currentIndex < images.length - 1 && (
                <TouchableOpacity style={[styles.navButton, styles.rightNav]} onPress={handleNext}>
                  <ChevronRight size={28} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Dot Indicator */}
          {images.length > 1 && images.length <= 8 && (
            <View style={styles.dotRow}>
              {images.map((_, idx) => (
                <TouchableOpacity key={idx} onPress={() => setCurrentIndex(idx)}>
                  <View
                    style={[
                      styles.dot,
                      idx === currentIndex ? styles.dotActive : styles.dotInactive
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Thumbnail Strip for many images */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStrip}
            >
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={`${img}-${idx}`}
                  onPress={() => setCurrentIndex(idx)}
                  style={[
                    styles.thumbnailWrapper,
                    currentIndex === idx && styles.activeThumbnail
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                  {currentIndex === idx && <View style={styles.thumbnailActiveOverlay} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.97)"
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 10
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center"
  },
  counterContainer: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },
  counterText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65
  },
  navOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)"
  },
  leftNav: {},
  rightNav: {},
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    gap: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3
  },
  dotActive: {
    backgroundColor: "#4CAF50",
    width: 18,
    borderRadius: 3
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.35)"
  },
  thumbnailStrip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center"
  },
  thumbnailWrapper: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden"
  },
  activeThumbnail: {
    borderColor: "#4CAF50"
  },
  thumbnailActiveOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(76,175,80,0.15)"
  },
  thumbnailImage: {
    width: "100%",
    height: "100%"
  }
});
