import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { registerApi } from "../api/auth";

type Props = {
  onRegister: () => void;
  onGoLogin: () => void;
};

export default function RegisterScreen({ onRegister, onGoLogin }: Props) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sử dụng useMutation cho Đăng ký tài khoản
  const registerMutation = useMutation({
    mutationFn: () => registerApi(
      username.trim(),
      email.trim(),
      password,
      name.trim() || undefined
    ),
    onSuccess: (result) => {
      if (result.success) {
        Alert.alert("Thành công", "Đăng ký tài khoản thành công! Hãy đăng nhập.", [
          { text: "OK", onPress: onGoLogin }
        ]);
      } else {
        setErrorMsg(result.message || "Đăng ký không thành công!");
      }
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || "Lỗi kết nối máy chủ khi đăng ký. Vui lòng thử lại!");
    }
  });

  const handleRegister = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng điền đủ Tên đăng nhập, Email và Mật khẩu!");
      return;
    }
    setErrorMsg("");
    registerMutation.mutate();
  };

  const isLoading = registerMutation.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Tên đăng nhập *"
        autoCapitalize="none"
        style={styles.input}
        editable={!isLoading}
      />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Họ và tên"
        style={styles.input}
        editable={!isLoading}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email *"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        editable={!isLoading}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mật khẩu *"
        secureTextEntry
        style={styles.input}
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleRegister} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Tạo tài khoản</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoLogin} style={styles.linkButton} disabled={isLoading}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
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


