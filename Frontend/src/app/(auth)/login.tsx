import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../api/auth";
import { useAuth } from "../../context/AuthContext";

type Props = {
  onLogin: () => void;
  onGoRegister: () => void;
};

export default function LoginScreen({ onLogin, onGoRegister }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();

  // Sử dụng useMutation của TanStack Query để đăng nhập
  const loginMutation = useMutation({
    mutationFn: () => loginApi(username.trim(), password),
    onSuccess: (result) => {
      if (result.success && result.accessToken) {
        login(result.accessToken, result.user);
        onLogin();
      } else {
        setErrorMsg(result.message || "Tài khoản hoặc mật khẩu không đúng!");
      }
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại!");
    }
  });

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập tài khoản và mật khẩu!");
      return;
    }
    setErrorMsg("");
    loginMutation.mutate();
  };

  const isLoading = loginMutation.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Tên đăng nhập"
        autoCapitalize="none"
        style={styles.input}
        editable={!isLoading}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mật khẩu"
        secureTextEntry
        style={styles.input}
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleLogin} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Tiếp tục</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoRegister} style={styles.linkButton} disabled={isLoading}>
        <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 32, color: "#1A2E1A" },
  errorText: { color: "#e53935", marginBottom: 16, fontWeight: "600" },
  input: { backgroundColor: "#f4f4f4", borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 16, color: "#333" },
  button: { backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  disabledButton: { backgroundColor: "#a5d6a7" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkButton: { marginTop: 18, alignItems: "center" },
  linkText: { color: "#2E7D32", fontSize: 14, fontWeight: "600" }
});


