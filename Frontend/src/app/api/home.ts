import apiConfig from "../../api.json";
import { Product, Category } from "../../types";

export interface HomeDataResponse {
  success: boolean;
  categories: Category[];
  featuredProducts: Product[];
}

const API_BASE_URL = apiConfig.baseUrl || 'http://192.168.190.14:8080';

/**
 * Hàm lấy dữ liệu trang chủ (bao gồm danh mục và sản phẩm nổi bật) từ API
 * @returns {Promise<HomeDataResponse>} Phản hồi từ API
 */
export const getHomeData = async (): Promise<HomeDataResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mobile/home`);

    if (!response.ok) {
      throw new Error(`Lỗi kết nối API Home: ${response.status} ${response.statusText}`);
    }

    const data: HomeDataResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi fetch dữ liệu trang chủ:", error);
    throw error;
  }
};
