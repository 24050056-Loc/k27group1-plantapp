// Shared TypeScript types cho PlantApp
// Các field dùng tên tiếng Việt để khớp với response từ backend PlantShop

export type Product = {
  id: number;
  category_id: number | null;
  ten_san_pham: string;
  ten_khoa_hoc?: string | null;
  mo_ta?: string | null;
  gia_tien: string; // DECIMAL từ MySQL trả về dạng string
  so_luong_kho: number;
  hinh_anh_url?: string | null; // relative path (images/cactus.jpg) hoặc URL
  dang_kinh_doanh?: number;
};

export type Category = {
  id: number;
  ten_danh_muc: string;
  mo_ta?: string | null;
};

export type CartItem = {
  cart_id: number;
  so_luong: number;
  product_id: number;
  ten_san_pham: string;
  gia_tien: string;
  hinh_anh_url?: string | null;
  so_luong_kho: number;
};

export type Order = {
  id: number;
  tong_thanh_toan?: string | null;
  trang_thai: string;
  ngay_dat_hang: string;
  dia_chi_giao_hang: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  ten_san_pham: string;
  so_luong: number;
  gia_tien: string; // Giá tại thời điểm order
  hinh_anh_url?: string | null;
};

export type OrderDetail = {
  id: number;
  user_id: number;
  tong_thanh_toan: string;
  trang_thai: string;
  ngay_dat_hang: string;
  dia_chi_giao_hang: string;
  so_dien_thoai_nhan?: string | null;
  ten_nguoi_nhan?: string | null;
  items: OrderItem[];
  phi_van_chuyen?: string | null;
  ma_giam_gia?: string | null;
  ghi_chu?: string | null;
};

export type User = {
  id: number;
  ten_dang_nhap: string;
  email: string;
  ho_ten: string | null;
  vai_tro: string;
  dia_chi?: string | null;
  so_dien_thoai?: string | null;
};
