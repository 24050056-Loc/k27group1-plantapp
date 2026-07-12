import axiosClient from "../api/axiosClient";
import { CartItem } from "../types";

const authConfig = (token?: string) =>
  token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

/** GET /cart — lấy giỏ hàng của user */
export async function getCart(token?: string): Promise<CartItem[]> {
  const response = await axiosClient.get("/cart", authConfig(token));
  return response.data.success ? response.data.data : [];
}

/** POST /cart — thêm sản phẩm vào giỏ */
export async function addToCart(
  token: string | undefined,
  product_id: number,
  so_luong: number = 1
): Promise<{ success: boolean; message: string }> {
  const response = await axiosClient.post(
    "/cart",
    { product_id, so_luong },
    authConfig(token)
  );
  return response.data;
}

/** DELETE /cart/:cartId — xóa một item khỏi giỏ hàng */
export async function removeFromCart(
  token: string | undefined,
  cartId: number
): Promise<{ success: boolean; message: string }> {
  const response = await axiosClient.delete(`/cart/${cartId}`, authConfig(token));
  return response.data;
}

/** PUT /cart/:cartId — cập nhật số lượng item trong giỏ */
export async function updateCartItemQuantity(
  token: string | undefined,
  cartId: number,
  so_luong: number
): Promise<{ success: boolean; message: string }> {
  const response = await axiosClient.put(
    `/cart/${cartId}`,
    { so_luong },
    authConfig(token)
  );
  return response.data;
}
