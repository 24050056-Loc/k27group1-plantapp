import axiosClient from "../api/axiosClient";
import { OrderDetail } from "../types";

export async function getOrderDetail(orderId: number): Promise<OrderDetail> {
  const response = await axiosClient.get(`/orders/${orderId}`);
  const payload = response.data?.data ?? response.data?.order ?? response.data;
  const rawItems = payload.items ?? payload.order_items ?? payload.chi_tiet_don_hang ?? [];

  return {
    ...payload,
    id: Number(payload.id ?? payload.order_id ?? orderId),
    user_id: Number(payload.user_id ?? payload.nguoi_dung_id ?? 0),
    tong_thanh_toan: String(payload.tong_thanh_toan ?? payload.total ?? 0),
    trang_thai: payload.trang_thai ?? payload.status ?? "",
    ngay_dat_hang: payload.ngay_dat_hang ?? payload.created_at ?? new Date().toISOString(),
    dia_chi_giao_hang: payload.dia_chi_giao_hang ?? payload.address ?? payload.dia_chi ?? "",
    so_dien_thoai_nhan: payload.so_dien_thoai_nhan ?? payload.phone ?? payload.so_dien_thoai ?? null,
    ten_nguoi_nhan: payload.ten_nguoi_nhan ?? payload.name ?? payload.ho_ten ?? null,
    phi_van_chuyen: payload.phi_van_chuyen ?? payload.shipping_fee ?? "0",
    ma_giam_gia: payload.ma_giam_gia ?? payload.coupon_code ?? null,
    items: rawItems.map((item: any, index: number) => ({
      id: Number(item.id ?? item.order_item_id ?? index),
      order_id: Number(item.order_id ?? payload.id ?? orderId),
      product_id: Number(item.product_id ?? item.san_pham_id ?? item.product?.id ?? 0),
      ten_san_pham: item.ten_san_pham ?? item.product_name ?? item.product?.ten_san_pham ?? "Sản phẩm",
      so_luong: Number(item.so_luong ?? item.quantity ?? 0),
      gia_tien: String(item.gia_tien ?? item.unit_price ?? item.price ?? 0),
      hinh_anh_url: item.hinh_anh_url ?? item.image_url ?? item.product?.hinh_anh_url ?? null,
    })),
  };
}

export async function cancelOrder(orderId: number): Promise<void> {
  await axiosClient.put(`/orders/${orderId}/cancel`);
}

export async function deleteOrder(orderId: number): Promise<void> {
  const response = await axiosClient.delete(`/orders/${orderId}`);
  if (response.data?.success === false) {
    throw new Error(response.data.message || "Không thể xóa đơn hàng");
  }
}