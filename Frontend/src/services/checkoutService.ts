import axiosClient from "../api/axiosClient";

/**
 * POST /checkout — tạo đơn hàng từ giỏ hàng hiện tại
 * Axios tự động đính kèm token.
 */
export async function placeOrder(
  token: string | undefined,
  dia_chi_giao_hang: string
): Promise<{ success: boolean; message: string; order_id?: number }> {
  const response = await axiosClient.post("/checkout", { dia_chi_giao_hang });
  return response.data;
}
