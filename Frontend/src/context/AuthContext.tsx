import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { User } from '../types';
import { setAuthToken } from '../api/axiosClient';
import apiConfig from '../api.json';

const BASE_URL = apiConfig.baseUrl || 'http://192.168.190.52:8080';
const HEARTBEAT_INTERVAL_MS = 45 * 1000; // 45 giây

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  updateUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Refs để quản lý heartbeat — tránh memory leak và duplicate
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const tokenRef = useRef<string | null>(null);

  // Giữ tokenRef đồng bộ với token state
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // =============================================
  // HEARTBEAT: Gửi tín hiệu hoạt động lên server
  // =============================================
  const sendHeartbeat = async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    try {
      const res = await fetch(`${BASE_URL}/users/heartbeat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (res.status === 403) {
        // Tài khoản bị khóa — dừng heartbeat nhưng KHÔNG tự logout
        // (user sẽ nhận thông báo khi thực hiện thao tác tiếp theo)
        console.warn('[Heartbeat] Tài khoản bị khóa, dừng heartbeat.');
        stopHeartbeat();
      }
    } catch {
      // Bỏ qua lỗi mạng — sẽ thử lại ở lần kế tiếp
    }
  };

  const startHeartbeat = () => {
    if (heartbeatTimerRef.current) return; // Tránh tạo nhiều timer trùng lặp
    // Gửi ngay lập tức khi bắt đầu
    sendHeartbeat();
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  // =============================================
  // APPSTATE: Bật/tắt heartbeat khi app foreground/background
  // =============================================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState === 'active') {
        // App trở về foreground — khởi động heartbeat (nếu đã đăng nhập)
        if (tokenRef.current) {
          startHeartbeat();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App ra background — dừng heartbeat để tiết kiệm pin & tránh online sai
        stopHeartbeat();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // =============================================
  // LOGIN / LOGOUT
  // =============================================
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    tokenRef.current = newToken;
    // Bắt đầu heartbeat ngay sau khi đăng nhập
    startHeartbeat();
  };

  const logout = () => {
    // Dừng heartbeat trước khi xóa token
    stopHeartbeat();
    setToken(null);
    setUser(null);
    setAuthToken(null);
    tokenRef.current = null;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Dọn dẹp khi AuthProvider unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
