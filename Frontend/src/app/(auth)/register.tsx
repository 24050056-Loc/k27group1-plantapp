import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from "react-native";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { registerApi } from "../../services/authService";
import { 
  AuthHeader, 
  FloatingLeavesTop, 
  BottomFoliage 
} from "./AuthBackground";

type Props = {
  onRegister: (user?: any) => void;
  onGoLogin: () => void;
};

export default function RegisterScreen({ onRegister, onGoLogin }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  // Đăng ký tài khoản thường
  const registerMutation = useMutation({
    mutationFn: () => registerApi(
      username.trim(),
      email.trim(),
      password,
      undefined,
      phone.trim() || undefined
    ),
    onSuccess: (result) => {
      if (result.success) {
        Alert.alert("Thành công", "Tạo tài khoản thành công! Hãy đăng nhập để bắt đầu hành trình xanh.", [
          { text: "Đăng nhập ngay", onPress: onGoLogin }
        ]);
      } else {
        setErrorMsg(result.message || "Đăng ký không thành công!");
      }
    },
    onError: (error: any) => {
      console.error("Register error:", error.response?.data?.message || error.message);
      if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Lỗi kết nối máy chủ khi đăng ký. Vui lòng thử lại!");
      }
    }
  });

  const handleRegister = () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu nhập lại không trùng khớp!");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    setErrorMsg("");
    registerMutation.mutate();
  };

  const isFormLoading = registerMutation.isPending;

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
            <Text style={styles.cardTitle}>Đăng ký</Text>
            <Text style={styles.cardSubtitle}>Bắt đầu hành trình xanh cùng Plantify!</Text>

            {errorMsg ? <Text style={styles.errorBanner}>{errorMsg}</Text> : null}

            {/* Input Tên đăng nhập */}
            <View style={styles.inputBox}>
              <User size={19} color="#6D856D" style={styles.inputLeftIcon} />
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Tên đăng nhập"
                placeholderTextColor="#9AA89A"
                autoCapitalize="none"
                style={styles.textInputField}
                editable={!isFormLoading}
              />
            </View>

            {/* Input Email */}
            <View style={styles.inputBox}>
              <Mail size={19} color="#6D856D" style={styles.inputLeftIcon} />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Email"
                placeholderTextColor="#9AA89A"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInputField}
                editable={!isFormLoading}
              />
            </View>

            {/* Input Số điện thoại */}
            <View style={styles.inputBox}>
              <Phone size={19} color="#6D856D" style={styles.inputLeftIcon} />
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Số điện thoại"
                placeholderTextColor="#9AA89A"
                keyboardType="phone-pad"
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

            {/* Input Nhập lại Mật khẩu */}
            <View style={styles.inputBox}>
              <Lock size={19} color="#6D856D" style={styles.inputLeftIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#9AA89A"
                secureTextEntry={!showConfirmPassword}
                style={styles.textInputField}
                editable={!isFormLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                style={styles.inputRightIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <Eye size={19} color="#6D856D" />
                ) : (
                  <EyeOff size={19} color="#6D856D" />
                )}
              </TouchableOpacity>
            </View>

            {/* Nút Đăng ký Chính */}
            <TouchableOpacity 
              style={[styles.primaryButton, isFormLoading && styles.disabledButton]} 
              onPress={handleRegister} 
              disabled={isFormLoading}
              activeOpacity={0.88}
            >
              {isFormLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.primaryButtonText}>Đăng ký</Text>
                  <ArrowRight size={18} color="#ffffff" style={styles.arrowIcon} />
                </View>
              )}
            </TouchableOpacity>

            {/* Link Chuyển sang Đăng nhập */}
            <View style={styles.bottomLinkContainer}>
              <Text style={styles.bottomPromptText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={onGoLogin} disabled={isFormLoading}>
                <Text style={styles.bottomActionLink}>Đăng nhập</Text>
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
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F6F3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6ECE6",
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 13,
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
  primaryButton: {
    backgroundColor: "#26732B",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#26732B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#93C596",
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
  bottomLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
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
