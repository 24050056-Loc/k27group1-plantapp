import axiosClient from "../api/axiosClient";

export type CouponValidateResponse = {
  success: boolean;
  message?: string;
  data?: {
    user_coupon_id?: number;
    id?: number;
    ma_code: string;
    mo_ta?: string;
    loai_giam_gia: "phan_tram" | "so_tien";
    gia_tri_giam: string | number;
  };
  so_tien_giam_gia?: number;
  tong_thanh_toan?: number;
};

/**
 * POST /coupons/validate — kiểm tra và tính toán số tiền giảm giá
 */
export async function validateCoupon(
  ma_code: string,
  tong_tien_hang: number,
  userId?: number
): Promise<CouponValidateResponse> {
  try {
    const response = await axiosClient.post("/coupons/validate", {
      ma_code,
      tong_tien_hang,
      userId,
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
  user_coupon_id?: number
): Promise<{
  success: boolean;
  message: string;
  order_id?: number;
  tong_tien_hang?: number;
  so_tien_giam?: number;
  tong_thanh_toan?: number;
}> {
  try {
    const response = await axiosClient.post("/checkout", {
      dia_chi_giao_hang,
      user_coupon_id: user_coupon_id,
    });
    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    let message = error.response?.data?.message || "Đặt hàng không thành công.";
    
    if (status === 409) {
      message = "Voucher này đã được sử dụng. Vui lòng chọn voucher khác.";
    } else if (status === 410) {
      message = "Voucher đã hết hạn.";
    }
    
    return {
      success: false,
      message: message,
    };
  }
}
