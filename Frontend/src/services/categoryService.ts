import axiosClient from "../api/axiosClient";
import { Category } from "../types";

/** GET /categories — danh sách tất cả danh mục */
export async function getCategories(): Promise<Category[]> {
  const response = await axiosClient.get("/categories");
  return Array.isArray(response.data) ? response.data : [];
}
