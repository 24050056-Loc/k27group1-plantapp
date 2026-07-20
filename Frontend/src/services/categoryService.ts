import axiosClient from "../api/axiosClient";
import { Category } from "../types";

/** GET /categories — danh sách tất cả danh mục */
export async function getCategories(): Promise<Category[]> {
  const response = await axiosClient.get("/categories");
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
}
