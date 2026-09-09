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

/** POST /users/:id/avatar - cập nhật avatar người dùng */
export async function updateUserAvatar(userId: number, imageUri: string): Promise<User> {
  const uri = imageUri.trim();
  const fileName = uri.split("/").pop() || `avatar-${Date.now()}.jpg`;
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const mimeType = fileExtension === "png"
    ? "image/png"
    : fileExtension === "webp"
      ? "image/webp"
      : "image/jpeg";

  const formData = new FormData();
  formData.append("avatar", {
    uri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await axiosClient.post(`/users/${userId}/avatar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.user ?? response.data.data ?? response.data;
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

  return response.data.user ?? response.data.data ?? response.data;
}
