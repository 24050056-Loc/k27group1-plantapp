import axios from "axios";
import axiosClient from "../api/axiosClient";
import { CartItem } from "../types";

const authConfig = (token?: string) =>
  token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

/** GET /cart — lấy giỏ hàng của user */
export async function getCart(token?: string): Promise<CartItem[]> {
  const response = await axiosClient.get("/cart", authConfig(token));
  const payload = response.data?.data ?? response.data?.cart ?? response.data;
  if (!Array.isArray(payload)) return [];

  return payload.map((item: any) => {
    let comboItems = item.combo_items;
    if (typeof comboItems === "string") {
      try {
        comboItems = JSON.parse(comboItems);
      } catch (e) {
        comboItems = null;
      }
    }

    let dacTinh = item.dac_tinh;
    if (typeof dacTinh === "string") {
      try {
        dacTinh = JSON.parse(dacTinh);
      } catch (e) {
        dacTinh = null;
      }
    }

    const isCombo = Boolean(
      item.is_combo ||
      dacTinh?.is_combo ||
      item.ten_san_pham?.toLowerCase().includes("starter kit") ||
      item.ten_san_pham?.toLowerCase().includes("combo")
    );

    return {
      ...item,
      cart_id: Number(item.cart_id ?? item.id ?? item.gio_hang_id),
      product_id: Number(item.product_id ?? item.san_pham_id ?? item.product?.id),
      ten_san_pham: item.ten_san_pham ?? item.product_name ?? item.product?.ten_san_pham ?? "Sản phẩm",
      gia_tien: String(item.gia_tien ?? item.price ?? item.product?.gia_tien ?? 0),
      so_luong: Number(item.so_luong ?? item.quantity ?? 1),
      so_luong_kho: Number(item.so_luong_kho ?? item.stock_quantity ?? item.product?.so_luong_kho ?? 0),
      hinh_anh_url: item.hinh_anh_url ?? item.image_url ?? item.product?.hinh_anh_url ?? null,
      mo_ta: item.mo_ta ?? null,
      is_combo: isCombo,
      original_price: item.original_price != null ? Number(item.original_price) : dacTinh?.originalPrice ?? null,
      discount_percent: item.discount_percent != null ? Number(item.discount_percent) : dacTinh?.discount ?? null,
      combo_items: Array.isArray(comboItems) ? comboItems : (Array.isArray(dacTinh?.items) ? dacTinh.items : null),
      dac_tinh: dacTinh,
    };
  });
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

/** DELETE /cart/:productId — backend xóa sản phẩm theo product_id */
export async function removeFromCart(
  token: string | undefined,
  productId: number
): Promise<{ success: boolean; message: string }> {
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new Error("Mã sản phẩm trong giỏ hàng không hợp lệ");
  }
  try {
    const response = await axiosClient.delete(`/cart/${productId}`, authConfig(token));
    if (response.data?.success === false) {
      throw new Error(response.data.message || "Không thể xóa sản phẩm");
    }
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.error;
      throw new Error(message || `Xóa sản phẩm thất bại (HTTP ${error.response?.status || "?"})`);
    }
    throw error;
  }
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
