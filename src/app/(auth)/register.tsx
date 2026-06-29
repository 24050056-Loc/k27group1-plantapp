import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onRegister: () => void;
  onGoLogin: () => void;
};

export default function RegisterScreen({ onRegister, onGoLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Họ và tên"
        style={styles.input}
      />
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
      <TouchableOpacity style={styles.button} onPress={onRegister}>
        <Text style={styles.buttonText}>Tạo tài khoản</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onGoLogin} style={styles.linkButton}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
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
