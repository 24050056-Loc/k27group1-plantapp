import axios from "axios";
import apiConfig from "../api.json";

// Tạo instance Axios với baseUrl cấu hình sẵn từ LAN IP
const axiosClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Hàm hỗ trợ set/gỡ bỏ Token Authorization cho tất cả các request Axios tiếp theo
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common["Authorization"];
  }
};

export default axiosClient;
