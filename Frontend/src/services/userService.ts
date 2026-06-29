import axiosClient from "../api/axiosClient";
import { User, Order } from "../types";

/** GET /users/:id — lấy thông tin profile người dùng */
export async function getUserProfile(userId: number): Promise<User | null> {
  try {
    const response = await axiosClient.get(`/users/${userId}`);
    return response.data;
  } catch {
    return null;
  }
}

/** GET /users/:id/orders — lịch sử đơn hàng của người dùng */
export async function getUserOrders(userId: number): Promise<Order[]> {
  try {
    const response = await axiosClient.get(`/users/${userId}/orders`);
    return response.data.success ? response.data.data : [];
  } catch {
    return [];
  }
}
