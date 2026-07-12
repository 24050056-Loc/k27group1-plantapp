import apiConfig from "../../api.json";

export interface CheckoutResponse {
  success: boolean;
  message: string;
  order_id?: number;
}

const API_BASE_URL = apiConfig.baseUrl || 'http://192.168.190.14:8080';

/**
 * Thực hiện thanh toán và đặt hàng từ giỏ hàng hiện tại (POST /checkout)
 * @param deliveryAddress Địa chỉ giao hàng
 * @param token Token JWT xác thực người dùng
 */
export const checkout = async (deliveryAddress: string, token: string): Promise<CheckoutResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        dia_chi_giao_hang: deliveryAddress
      })
    });

    const data: CheckoutResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi gọi API checkout:", error);
    return {
      success: false,
      message: "Không thể kết nối đến máy chủ hoặc lỗi mạng!"
    };
  }
};
