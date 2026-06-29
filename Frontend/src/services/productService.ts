import axiosClient from "../api/axiosClient";
import { Product } from "../types";

/** GET /product — toàn bộ sản phẩm (dùng cho Mall) */
export async function getProducts(): Promise<Product[]> {
  const response = await axiosClient.get("/product");
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /product/featured — top 6 sản phẩm (dùng cho Home) */
export async function getFeaturedProducts(): Promise<Product[]> {
  const response = await axiosClient.get("/product/featured");
  return Array.isArray(response.data) ? response.data : [];
}
