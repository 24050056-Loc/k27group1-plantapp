import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { loginApi, googleLoginApi } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import {
  AuthHeader,
  FloatingLeavesTop,
  BottomFoliage,
} from "./AuthBackground";
import { GOOGLE_AUTH_CONFIG } from "../../config/googleAuth";

// Cần gọi để đóng browser sau khi xác thực xong
WebBrowser.maybeCompleteAuthSession();

type Props = {
  onLogin: (user?: any) => void;
  onGoRegister: () => void;
};

export default function LoginScreen({ onLogin, onGoRegister }: Props) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login } = useAuth();

  // --- Google Sign-In setup ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_AUTH_CONFIG.EXPO_WEB_CLIENT_ID,
    androidClientId: GOOGLE_AUTH_CONFIG.ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_AUTH_CONFIG.IOS_CLIENT_ID || undefined,
  });

  // Xử lý kết quả từ Google OAuth
  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleToken(id_token);
      } else {
        setIsGoogleLoading(false);
        setErrorMsg("Không nhận được token từ Google. Vui lòng thử lại!");
      }
    } else if (response?.type === "error") {
      setIsGoogleLoading(false);
      setErrorMsg("Đăng nhập Google thất bại: " + (response.error?.message || "Lỗi không xác định"));
    } else if (response?.type === "dismiss") {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const result = await googleLoginApi(idToken);
      if (result.success && result.accessToken) {
        login(result.accessToken, result.user);
        onLogin(result.user);
      } else {
        setErrorMsg(result.message || "Đăng nhập Google thất bại!");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể kết nối máy chủ khi đăng nhập Google.";
      setErrorMsg(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      setErrorMsg(
        "Google Sign-In chưa sẵn sàng. Vui lòng kiểm tra cấu hình GOOGLE_CLIENT_ID trong config/googleAuth.ts"
      );
      return;
    }
    setErrorMsg("");
    setInfoMsg("");
    setIsGoogleLoading(true);
    await promptAsync();
  };

  // --- Email/Password Sign-In ---
  const loginMutation = useMutation({
    mutationFn: () => loginApi(usernameOrEmail.trim(), password),
    onSuccess: (result) => {
      if (result.success && result.accessToken) {
        login(result.accessToken, result.user);
        onLogin(result.user);
      } else {
        setErrorMsg(result.message || "Tài khoản hoặc mật khẩu không đúng!");
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error.response?.data?.message || error.message);
      if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng kiểm tra Internet.");
      }
    },
  });

  const handleLogin = () => {
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập tài khoản/email và mật khẩu!");
      return;
    }
    setErrorMsg("");
    setInfoMsg("");
    loginMutation.mutate();
  };

  const isFormLoading = loginMutation.isPending || isGoogleLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8F3" />

      {/* Họa tiết lá cây trang trí nền trên */}
      <FloatingLeavesTop />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Thương hiệu Plantify */}
          <AuthHeader />

          {/* Card Trắng Bo Tròn */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardSubtitle}>Chào mừng bạn quay trở lại!</Text>

            {errorMsg ? <Text style={styles.errorBanner}>{errorMsg}</Text> : null}
            {infoMsg ? <Text style={styles.infoBanner}>{infoMsg}</Text> : null}

            {/* ===== NÚT ĐĂNG NHẬP GOOGLE ===== */}
            <TouchableOpacity
              style={[styles.googleButton, isFormLoading && styles.disabledButton]}
              onPress={handleGoogleLogin}
              disabled={isFormLoading}
              activeOpacity={0.85}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#444" size="small" />
              ) : (
                <View style={styles.googleButtonInner}>
                  {/* Google "G" logo dạng SVG inline qua Text */}
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Đường kẻ phân cách */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Input Tên đăng nhập hoặc Email */}
            <View style={styles.inputBox}>
              <Mail size={19} color="#6D856D" style={styles.inputLeftIcon} />
              <TextInput
                value={usernameOrEmail}
                onChangeText={(text) => {
                  setUsernameOrEmail(text);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Tên đăng nhập hoặc Email"
                placeholderTextColor="#9AA89A"
                autoCapitalize="none"
                style={styles.textInputField}
                editable={!isFormLoading}
              />
            </View>

            {/* Input Mật khẩu */}
            <View style={styles.inputBox}>
              <Lock size={19} color="#6D856D" style={styles.inputLeftIcon} />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Mật khẩu"
                placeholderTextColor="#9AA89A"
                secureTextEntry={!showPassword}
                style={styles.textInputField}
                editable={!isFormLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.inputRightIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <Eye size={19} color="#6D856D" />
                ) : (
                  <EyeOff size={19} color="#6D856D" />
                )}
              </TouchableOpacity>
            </View>

            {/* Nút Đăng nhập Chính */}
            <TouchableOpacity
              style={[styles.primaryButton, isFormLoading && styles.primaryDisabledButton]}
              onPress={handleLogin}
              disabled={isFormLoading}
              activeOpacity={0.88}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                  <ArrowRight size={18} color="#ffffff" style={styles.arrowIcon} />
                </View>
              )}
            </TouchableOpacity>

            {/* Hàng Ghi nhớ & Quên mật khẩu */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.customCheckbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Check size={13} color="#ffffff" strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Link Chuyển sang Đăng ký */}
            <View style={styles.bottomLinkContainer}>
              <Text style={styles.bottomPromptText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={onGoRegister} disabled={isFormLoading}>
                <Text style={styles.bottomActionLink}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Khoảng đệm để không bị che bởi bụi cây */}
          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bụi cây xanh lá nghệ thuật ở chân màn hình */}
      <BottomFoliage />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F3",
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    shadowColor: "#1B4A1A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#184319",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: "#667D66",
    fontWeight: "400",
    marginBottom: 18,
  },
  errorBanner: {
    color: "#D32F2F",
    backgroundColor: "#FFEBEE",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 14,
  },
  infoBanner: {
    color: "#2E7D32",
    backgroundColor: "#E8F5E9",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 14,
  },
  // --- Google Button ---
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DDE4DD",
    height: 52,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  googleIconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C3E2C",
  },
  // --- Divider ---
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8EEE8",
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#8FA08F",
    fontWeight: "500",
  },
  // --- Input fields ---
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F6F3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6ECE6",
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  inputRightIcon: {
    padding: 6,
  },
  textInputField: {
    flex: 1,
    fontSize: 14.5,
    color: "#222222",
    height: "100%",
  },
  // --- Primary button ---
  primaryButton: {
    backgroundColor: "#26732B",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#26732B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryDisabledButton: {
    backgroundColor: "#93C596",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  arrowIcon: {
    marginLeft: 8,
  },
  // --- Options row ---
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#889C88",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#26732B",
    borderColor: "#26732B",
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#556E55",
    fontWeight: "500",
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#26732B",
    fontWeight: "600",
  },
  // --- Bottom link ---
  bottomLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  bottomPromptText: {
    fontSize: 13.5,
    color: "#5B735B",
  },
  bottomActionLink: {
    fontSize: 13.5,
    color: "#26732B",
    fontWeight: "700",
  },
});
