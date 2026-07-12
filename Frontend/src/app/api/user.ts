// 1. Định nghĩa Interface cho dữ liệu User từ API
export interface User {
  id: number;
  ten_dang_nhap: string;
  email: string;
  ho_ten: string;
  so_dien_thoai: string | null; // API đang trả về null
  vai_tro: 'admin' | 'khach_hang' | string; // Gợi ý cụ thể các vai trò
  dang_hoat_dong: number; // 1: Hoạt động, 0: Khóa
  ngay_tao: string; // Kiểu ISO Date string
}

const API_URL = 'http://192.168.190.14:8080/users';

// 2. Hàm gọi API để lấy danh sách users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: User[] = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user:", error);
    throw error;
  }
};

export default getUsers;