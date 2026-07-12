import apiConfig from "../../api.json";

export interface Coupon {
  id: number;
  ma_code: string;
  mo_ta: string | null;
  loai_giam_gia: 'phan_tram' | 'tien_mat';
  gia_tri_giam: string; // DECIMAL in DB
  dang_ap_dung: number; // TINYINT (0 or 1)
  ngay_tao: string;
}

export interface CouponResponse {
  success: boolean;
  data: Coupon;
  message?: string;
}

export interface CouponListResponse {
  success: boolean;
  data: Coupon[];
  message?: string;
}

export interface CouponValidateResponse {
  success: boolean;
  data: Coupon;
  so_tien_giam_gia: number;
  tong_thanh_toan: number;
  message?: string;
}

const API_BASE_URL = apiConfig.baseUrl || 'http://192.168.190.14:8080';

/**
 * Lấy danh sách tất cả mã giảm giá (GET /coupons)
 */
export const getCoupons = async (token?: string): Promise<Coupon[]> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/coupons`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const json: CouponListResponse = await response.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error('Lỗi lấy danh sách coupon:', error);
    throw error;
  }
};

/**
 * Lấy thông tin coupon bằng mã code (GET /coupons/code/:ma_code)
 */
export const getCouponByCode = async (code: string, token?: string): Promise<Coupon> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/coupons/code/${code}`, {
      method: 'GET',
      headers,
    });

    const json: CouponResponse = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Mã giảm giá không hợp lệ');
    }

    return json.data;
  } catch (error) {
    console.error('Lỗi lấy thông tin coupon theo code:', error);
    throw error;
  }
};

/**
 * Xác thực mã giảm giá và tính toán số tiền giảm (POST /coupons/validate)
 */
export const validateCoupon = async (
  code: string,
  totalAmount: number,
  token?: string
): Promise<CouponValidateResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ma_code: code,
        tong_tien_hang: totalAmount,
      }),
    });

    const data: CouponValidateResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi xác thực coupon:', error);
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ hoặc lỗi mạng!',
      data: {} as Coupon,
      so_tien_giam_gia: 0,
      tong_thanh_toan: totalAmount,
    };
  }
};

/**
 * Lấy thông tin chi tiết coupon bằng ID (GET /coupons/:id)
 */
export const getCouponById = async (id: number, token?: string): Promise<Coupon> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
      method: 'GET',
      headers,
    });

    const json: CouponResponse = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Mã giảm giá không tồn tại');
    }

    return json.data;
  } catch (error) {
    console.error(`Lỗi lấy coupon theo ID ${id}:`, error);
    throw error;
  }
};
