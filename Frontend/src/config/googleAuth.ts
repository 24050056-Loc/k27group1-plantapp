/**
 * Cấu hình Google OAuth cho PlantApp
 *
 * Cách lấy Client ID:
 * 1. Vào https://console.cloud.google.com/
 * 2. Tạo project (hoặc chọn project đã có)
 * 3. Vào "APIs & Services" → "Credentials"
 * 4. Tạo "OAuth 2.0 Client ID" loại "Web application"
 * 5. Thêm URI: https://auth.expo.io/@<your-expo-username>/<your-app-slug>
 *    vào "Authorized redirect URIs"
 * 6. Copy "Client ID" (dạng: xxxx.apps.googleusercontent.com) điền vào EXPO_WEB_CLIENT_ID bên dưới
 *
 * Lưu ý: File này KHÔNG được commit lên GitHub nếu có thông tin nhạy cảm.
 */

export const GOOGLE_AUTH_CONFIG = {
  // Web Client ID từ Google Cloud Console
  // Dán Client ID vào đây (kết thúc bằng .apps.googleusercontent.com)
  EXPO_WEB_CLIENT_ID: "550683784830-hmgleoankidism4uftdjesgitsr5odnk.apps.googleusercontent.com",

  // Android Client ID (nếu có, để trống nếu chưa cần)
  ANDROID_CLIENT_ID: "",

  // iOS Client ID (nếu có, để trống nếu chưa cần)
  IOS_CLIENT_ID: "",
};
