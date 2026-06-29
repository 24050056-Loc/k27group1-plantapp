import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onLogin: () => void;
  onGoRegister: () => void;
};

export default function LoginScreen({ onLogin, onGoRegister }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mật khẩu"
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Tiếp tục</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onGoRegister} style={styles.linkButton}>
        <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 32, color: "#1A2E1A" },
  input: { backgroundColor: "#f4f4f4", borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 16, color: "#333" },
  button: { backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkButton: { marginTop: 18, alignItems: "center" },
  linkText: { color: "#2E7D32", fontSize: 14, fontWeight: "600" }
});
