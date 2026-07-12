import apiConfig from "../../api.json";

export interface OrderItemInput {
  product_id: number;
  so_luong: number;
  gia_luc_mua: number;
}

export interface CreateOrderInput {
  user_id?: number | null;
  tong_tien_hang: number;
  dia_chi_giao_hang: string;
  phuong_thuc_thanh_toan: 'cod' | 'bank_transfer';
  trang_thai?: string;
  items: OrderItemInput[];
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  orderId?: number;
  error?: string;
}

const API_BASE_URL = apiConfig.baseUrl || 'http://192.168.190.14:8080';

/**
 * Tạo mới đơn hàng (POST /order)
 */
export const createOrder = async (orderData: CreateOrderInput, token?: string): Promise<CreateOrderResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    const data: CreateOrderResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ hoặc lỗi mạng!',
    };
  }
};

/**
 * Lấy toàn bộ danh sách đơn hàng (GET /order - Cho Admin)
 */
export const getAllOrders = async (token?: string): Promise<any[]> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/order`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết đơn hàng theo ID (GET /order/:id)
 */
export const getOrderById = async (id: number, token?: string): Promise<any> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/order/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết đơn hàng ID ${id}:`, error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái đơn hàng (PUT /order/:id - Cho Admin)
 */
export const updateOrderStatus = async (id: number, status: string, token?: string): Promise<any> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/order/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật trạng thái đơn hàng ID ${id}:`, error);
    throw error;
  }
};
