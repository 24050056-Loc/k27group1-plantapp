// 1. Định nghĩa Interface cho dữ liệu Product dựa trên API
export interface Product {
    id: number;
    category_id: number;
    ten_san_pham: string;
    ten_khoa_hoc: string | null;
    mo_ta: string;
    gia_tien: string; // API trả về dạng chuỗi định dạng thập phân
    so_luong_kho: number;
    hinh_anh_url: string;
    dang_kinh_doanh: number; // 1: đang kinh doanh, 0: ngừng kinh doanh
    ngay_tao: string;
    ngay_cap_nhat: string;
}

// 2. Định nghĩa Base URL của API
const API_BASE_URL = 'http://192.168.190.14:8080';

/**
 * Hàm lấy danh sách sản phẩm từ API
 * @returns {Promise<Product[]>} Mảng các sản phẩm
 */
export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/product`);

        if (!response.ok) {
            throw new Error(`Lỗi kết nối API: ${response.status} ${response.statusText}`);
        }

        const data: Product[] = await response.json();
        return data;
    } catch (error) {
        console.error("Lỗi khi fetch danh sách sản phẩm:", error);
        throw error;
    }
};

// Thêm Interface cho Category dựa trên API mới của bạn
export interface Category {
    id: number;
    ten_danh_muc: string;
    mo_ta: string;
    ngay_tao: string;
}

// Định nghĩa interface cho phản hồi bọc ngoài của API Category
export interface CategoryResponse {
    success: boolean;
    data: Category[];
}

// ... Giữ nguyên phần interface Product và hàm getProducts cũ ...

/**
 * Hàm lấy danh sách danh mục từ API
 * @returns {Promise<Category[]>} Mảng các danh mục
 */
export const getCategories = async (): Promise<Category[]> => {
    try {
        const response = await fetch('http://192.168.190.13:8080/categories');

        if (!response.ok) {
            throw new Error(`Lỗi kết nối API Categories: ${response.status}`);
        }

        const json: CategoryResponse = await response.json();

        if (json.success) {
            return json.data;
        } else {
            throw new Error("Lấy dữ liệu danh mục không thành công");
        }
    } catch (error) {
        console.error("Lỗi khi fetch danh mục:", error);
        throw error;
    }
};