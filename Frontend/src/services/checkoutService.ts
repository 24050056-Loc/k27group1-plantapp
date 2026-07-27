import axiosClient from "../api/axiosClient";

export type CouponValidateResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    ma_code: string;
    mo_ta?: string;
    loai_giam_gia: "phan_tram" | "so_tien";
    gia_tri_giam: string;
  };
  so_tien_giam_gia?: number;
  tong_thanh_toan?: number;
};

/**
 * POST /coupons/validate — kiểm tra và tính toán số tiền giảm giá
 */
export async function validateCoupon(
  ma_code: string,
  tong_tien_hang: number
): Promise<CouponValidateResponse> {
  try {
    const response = await axiosClient.post("/coupons/validate", {
      ma_code,
      tong_tien_hang,
    });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Mã giảm giá không hợp lệ!",
    };
  }
}

/**
 * POST /checkout — tạo đơn hàng từ giỏ hàng hiện tại (có mã giảm giá nếu có)
 */
export async function placeOrder(
  token: string | undefined,
  dia_chi_giao_hang: string,
  ma_giam_gia?: string
): Promise<{
  success: boolean;
  message: string;
  order_id?: number;
  tong_tien_hang?: number;
  so_tien_giam?: number;
  tong_thanh_toan?: number;
}> {
  const response = await axiosClient.post("/checkout", {
    dia_chi_giao_hang,
    ma_giam_gia: ma_giam_gia || undefined,
  });
  return response.data;
}
