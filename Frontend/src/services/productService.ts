import axiosClient from "../api/axiosClient";
import { Product } from "../types";

/** GET /products — toàn bộ sản phẩm (dùng cho Mall) */
export async function getProducts(): Promise<Product[]> {
  const response = await axiosClient.get("/products");
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /products/featured — top 6 sản phẩm (dùng cho Home) */
export async function getFeaturedProducts(): Promise<Product[]> {
  const response = await axiosClient.get("/products/featured");
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /products/search?q=keyword — tìm kiếm sản phẩm gợi ý */
export async function searchProducts(keyword: string): Promise<Product[]> {
  if (!keyword.trim()) return [];
  try {
    const response = await axiosClient.get("/products/search", {
      params: { q: keyword.trim() }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn("Lỗi khi tìm kiếm qua API /products/search:", error);
    return [];
  }
}
