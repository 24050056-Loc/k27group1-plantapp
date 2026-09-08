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

/** PUT /users/:id - cập nhật thông tin profile người dùng */
export async function updateUserProfile(
  userId: number,
  profile: Pick<User, "ho_ten" | "email" | "so_dien_thoai" | "dia_chi">
): Promise<User> {
  const response = await axiosClient.put(`/users/${userId}`, {
    name: profile.ho_ten,
    email: profile.email,
    phone: profile.so_dien_thoai,
    address: profile.dia_chi,
  });

  return response.data.user;
}
