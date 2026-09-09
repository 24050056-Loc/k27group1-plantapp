import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView
} from "react-native";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  if (!visible || !images || images.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header với nút đóng (X) và Indicator */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Main Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[currentIndex] }}
            style={styles.fullImage}
            resizeMode="contain"
          />

          {/* Navigation Arrows for multi-image */}
          {images.length > 1 && currentIndex > 0 && (
            <TouchableOpacity style={[styles.navButton, styles.leftNav]} onPress={handlePrev}>
              <ChevronLeft size={28} color="#FFF" />
            </TouchableOpacity>
          )}

          {images.length > 1 && currentIndex < images.length - 1 && (
            <TouchableOpacity style={[styles.navButton, styles.rightNav]} onPress={handleNext}>
              <ChevronRight size={28} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Thumbnail Preview Strip */}
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
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "space-between"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  counterText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700"
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  leftNav: {
    left: 12
  },
  rightNav: {
    right: 12
  },
  thumbnailStrip: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center"
  },
  thumbnailWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden"
  },
  activeThumbnail: {
    borderColor: "#4CAF50"
  },
  thumbnailImage: {
    width: "100%",
    height: "100%"
  }
});
