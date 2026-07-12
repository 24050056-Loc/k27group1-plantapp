// 1. Định nghĩa Interface cho dữ liệu trả về từ API
export interface CartResponse {
  success: boolean;
  message: string;
  data?: any; // Thay 'any' bằng kiểu dữ liệu cấu trúc giỏ hàng thực tế của bạn
}

// 2. Định nghĩa URL của API
const API_URL = 'http://192.168.190.14:8080/cart';

/**
 * Hàm lấy thông tin giỏ hàng từ API bằng Fetch
 * @param token Token xác thực (JWT) nếu có
 */
export const fetchCartData = async (token?: string): Promise<CartResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Nếu có token (đã đăng nhập), đính kèm vào Header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: headers,
      // Nếu API cần định danh qua Cookie/Session, hãy bỏ comment dòng dưới:
      // credentials: 'include', 
    });

    // Chuyển đổi dữ liệu nhận được sang dạng JSON
    const data: CartResponse = await response.json();
    return data;

  } catch (error) {
    // Xử lý lỗi kết nối đường truyền, sai IP, hoặc sập server
    console.error('Fetch lỗi:', error);
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ hoặc lỗi mạng!',
    };
  }
};