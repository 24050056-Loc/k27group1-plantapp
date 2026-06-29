import axiosClient from "../api/axiosClient";
import { CartItem } from "../types";

/** GET /cart — lấy giỏ hàng của user (Axios tự gắn token) */
export async function getCart(token?: string): Promise<CartItem[]> {
  const response = await axiosClient.get("/cart");
  return response.data.success ? response.data.data : [];
}

/** POST /cart — thêm sản phẩm vào giỏ (Axios tự gắn token) */
export async function addToCart(
  token: string | undefined,
  product_id: number,
  so_luong: number = 1
): Promise<{ success: boolean; message: string }> {
  const response = await axiosClient.post("/cart", { product_id, so_luong });
  return response.data;
}
