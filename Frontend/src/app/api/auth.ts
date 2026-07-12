import apiConfig from "../../api.json";
import { User } from "../../types";

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  user?: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
}

const API_BASE_URL = apiConfig.baseUrl || 'http://192.168.190.14:8080';

/**
 * Hàm gọi API đăng nhập
 * @param username Tên đăng nhập
 * @param password Mật khẩu
 * @returns {Promise<LoginResponse>} Phản hồi từ API
 */
export const loginApi = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data: LoginResponse = await response.json();

    if (!response.ok) {
      // Giả lập cấu trúc lỗi của Axios để tương thích với component hiện tại
      const error: any = new Error(data.message || "Đăng nhập không thành công!");
      error.response = { data };
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Lỗi gọi API đăng nhập:", error);
    throw error;
  }
};

/**
 * Hàm gọi API đăng ký tài khoản
 * @param username Tên đăng nhập
 * @param email Email đăng ký
 * @param password Mật khẩu
 * @param fullName Họ và tên (không bắt buộc)
 * @returns {Promise<RegisterResponse>} Phản hồi từ API
 */
export const registerApi = async (
  username: string,
  email: string,
  password: string,
  fullName?: string
): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        full_name: fullName,
      }),
    });

    const data: RegisterResponse = await response.json();

    if (!response.ok) {
      // Giả lập cấu trúc lỗi của Axios để tương thích với component hiện tại
      const error: any = new Error(data.message || "Đăng ký không thành công!");
      error.response = { data };
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Lỗi gọi API đăng ký:", error);
    throw error;
  }
};
