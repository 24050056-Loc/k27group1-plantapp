-- =========================================================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU CỦA PLANT SHOP
-- =========================================================================
CREATE DATABASE IF NOT EXISTS `tree_shop_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tree_shop_db`;

-- Tắt tạm thời kiểm tra khóa ngoại để thực hiện làm sạch dữ liệu cũ
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa tất cả các bảng cũ để làm mới cấu trúc
DROP TABLE IF EXISTS `blogs`;
DROP TABLE IF EXISTS `care_reminders`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `chat_history`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `plant_diagnoses`;
DROP TABLE IF EXISTS `product_reviews`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `promotional_events`;
DROP TABLE IF EXISTS `user_garden`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `users_points`;
DROP TABLE IF EXISTS `virtual_plants`;
DROP TABLE IF EXISTS `wishlist`;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;


-- =========================================================================
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- =========================================================================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ho_ten` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vai_tro` ENUM('admin', 'quan_ly', 'khach_hang', 'khach_vang_lai') COLLATE utf8mb4_unicode_ci DEFAULT 'khach_hang',
  `dang_hoat_dong` TINYINT(1) DEFAULT 1,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn dữ liệu mẫu cho bảng Users
INSERT INTO `users` (`id`, `ten_dang_nhap`, `mat_khau`, `email`, `ho_ten`, `dia_chi`, `so_dien_thoai`, `vai_tro`, `dang_hoat_dong`, `ngay_tao`) VALUES
(1, 'admin', '$2b$10$FE4oyUqeEhGtrn/veXFavOiiBAYIZm6RCZo/pzo7t9rEXJ41r2Bna', 'admin@treeshop.com', 'Quản trị viên', NULL, NULL, 'admin', 1, '2026-07-10 02:50:25'),
(2, 'khach01', '123456', 'khach01@gmail.com', 'Nguyễn Văn Khách', NULL, NULL, 'khach_hang', 1, '2026-07-10 02:50:25');


-- =========================================================================
-- 2. BẢNG DANH MỤC SẢN PHẨM (CATEGORIES)
-- =========================================================================
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_danh_muc` (`ten_danh_muc`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn dữ liệu mẫu cho bảng Categories
INSERT INTO `categories` (`id`, `ten_danh_muc`, `mo_ta`, `ngay_tao`) VALUES
(1, 'Cây Cảnh', 'Cây để bàn, trang trí nội thất', '2026-07-10 02:50:25'),
(2, 'Cây Giống', 'Cây giống ăn trái, rau màu', '2026-07-10 02:50:25');


-- =========================================================================
-- 3. BẢNG SẢN PHẨM (PRODUCTS)
-- =========================================================================
CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT DEFAULT NULL,
  `ten_san_pham` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_khoa_hoc` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_tien` DECIMAL(10,2) NOT NULL,
  `so_luong_kho` INT DEFAULT 0,
  `hinh_anh_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_kinh_doanh` TINYINT(1) DEFAULT 1,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ar_model_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dac_tinh` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_products_category_price` (`category_id`, `gia_tien`),
  KEY `idx_products_name` (`ten_san_pham`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_chk_1` CHECK (`gia_tien` >= 0),
  CONSTRAINT `products_chk_2` CHECK (`so_luong_kho` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn dữ liệu mẫu cho bảng Products
INSERT INTO `products` (`id`, `category_id`, `ten_san_pham`, `ten_khoa_hoc`, `mo_ta`, `gia_tien`, `so_luong_kho`, `hinh_anh_url`, `dang_kinh_doanh`, `ngay_tao`, `ngay_cap_nhat`, `ar_model_url`, `dac_tinh`) VALUES
(1, 1, 'Cây Xương Rồng', NULL, 'Chịu hạn cực tốt. Chi tiết: Tưới nước 1 lần/tuần.', 50000.00, 100, 'images/cactus.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(2, 1, 'Cây Lưỡi Hổ', NULL, 'Thanh lọc không khí. Chi tiết: Ưa bóng râm.', 120000.00, 50, 'images/SnakePlant.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(3, 1, 'Cây Sen Đá', NULL, 'Tượng trưng cho tình yêu vĩnh cửu.', 80000.00, 80, 'images/Succulent.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(4, 1, 'Cây Bàng Đài Loan', NULL, 'Tạo không gian xanh mát hiện đại.', 250000.00, 20, 'images/cay_bang_dai_loan.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(5, 2, 'Giống Cây Cà Chua', NULL, 'Khỏe mạnh, trái sai. Thu hoạch sau 70-80 ngày.', 15000.00, 500, 'images/Cay_Ca_Chua.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(6, 2, 'Giống Ớt Chỉ Thiên', NULL, 'Vị cay nồng, năng suất cao.', 12000.00, 300, 'images/Ot_Chi_Thien.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(7, 2, 'Giống Hoa Hướng Dương', NULL, 'Bông to rực rỡ. Nở hoa sau 60 ngày.', 25000.00, 150, 'images/Huong-Duong.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(8, 2, 'Cây Giống Chanh Dây', NULL, 'Leo khỏe, che mát sân thượng.', 45000.00, 100, 'images/Chanh_Day.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(9, 2, 'Cây Giống Cam Sành', NULL, 'Vị ngọt thanh, vỏ dày.', 65000.00, 60, 'images/CamSanh.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(10, 2, 'Cây Giống Xoài Cát', NULL, 'Xoài Cát Hòa Lộc nổi tiếng.', 85000.00, 40, 'images/XoaiCat.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(11, 2, 'Cây Mít Thái', NULL, 'Trái quanh năm, múi dày giòn.', 70000.00, 45, 'images/MitThai.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(12, 2, 'Cây Chôm Chôm Thái', NULL, 'Trái to, râu dài, cơm dày.', 90000.00, 30, 'images/ChomChomThai.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(13, 2, 'Cây Nhãn Ido', NULL, 'Hạt nhỏ, cơm dày, độ đường cao.', 75000.00, 35, 'images/NhanIdo.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(14, 2, 'Sầu Riêng Ri6', NULL, 'Cơm vàng hạt lép, mùi thơm nồng.', 150000.00, 25, 'images/SauRiengRi6.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(15, 2, 'Cây Măng Cụt', NULL, 'Vị chua ngọt thanh khiết.', 110000.00, 20, 'images/CayMangCut.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(16, 2, 'Cây Vú Sữa Lò Rèn', NULL, 'Đặc sản miền Tây.', 80000.00, 30, 'images/VuSuaLoRen.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(17, 2, 'Cây Sơ Ri', NULL, 'Hàm lượng Vitamin C cực cao.', 55000.00, 50, 'images/CaySoRi.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(18, 2, 'Mãng Cầu Xiêm', NULL, 'Trái to, vị chua ngọt giải nhiệt.', 60000.00, 40, 'images/MangCauXiem.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(19, 2, 'Dừa Xiêm Lùn', NULL, 'Nước ngọt, cây thấp dễ hái.', 45000.00, 100, 'images/DuaXiemLun.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(20, 2, 'Bưởi Da Xanh', NULL, 'Ruột hồng, tép bó, ngọt thanh.', 95000.00, 30, 'images/BuoiDaXanh.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(21, 2, 'Cây Cà Na Thái', NULL, 'Chịu ngập nước tốt.', 50000.00, 50, 'images/CayCaNaThai.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(22, 2, 'Cây Hồng Quân', NULL, 'Trái chín tím đỏ, gợi nhớ tuổi thơ.', 65000.00, 15, 'images/CayHongQuan.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(23, 2, 'Dâu Xanh (Dâu Da)', NULL, 'Trái mọc thành chùm từ thân.', 60000.00, 25, 'images/CayDauXanh.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL),
(24, 2, 'Cây Chanh Giấy', NULL, 'Vỏ mỏng, nhiều nước, rất thơm.', 35000.00, 120, 'images/CayChanhGiay.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL);


-- =========================================================================
-- 4. BẢNG MÃ GIẢM GIÁ (COUPONS)
-- =========================================================================
CREATE TABLE `coupons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ma_code` VARCHAR(20) NOT NULL,
  `loai_giam_gia` ENUM('phan_tram', 'so_tien_co_dinh') DEFAULT 'phan_tram',
  `gia_tri_giam` DECIMAL(10,2) NOT NULL,
  `dang_ap_dung` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_code` (`ma_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Coupons)


-- =========================================================================
-- 5. BẢNG BÀI VIẾT - TIN TỨC (BLOGS)
-- =========================================================================
CREATE TABLE `blogs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tieu_de` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tom_tat` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` LONGTEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `hinh_anh_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `danh_muc` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_hien_thi` TINYINT(1) DEFAULT 1,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_blogs_slug` (`slug`),
  KEY `idx_blogs_category` (`danh_muc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Blogs)


-- =========================================================================
-- 6. BẢNG GIỎ HÀNG (CART)
-- =========================================================================
CREATE TABLE `cart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `product_id` INT DEFAULT NULL,
  `so_luong` INT DEFAULT 1,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_chk_1` CHECK (`so_luong` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Cart)


-- =========================================================================
-- 7. BẢNG SẢN PHẨM YÊU THÍCH (WISHLIST)
-- =========================================================================
CREATE TABLE `wishlist` (
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `ngay_them` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Wishlist)


-- =========================================================================
-- 8. BẢNG KHU VƯỜN NGƯỜI DÙNG (USER_GARDEN)
-- =========================================================================
CREATE TABLE `user_garden` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `ten_cay` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hinh_anh_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_them` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `user_garden_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_garden_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho User Garden)


-- =========================================================================
-- 9. BẢNG NHẮC NHỞ CHĂM SÓC CÂY (CARE_REMINDERS)
-- =========================================================================
CREATE TABLE `care_reminders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `garden_id` INT NOT NULL,
  `loai_nhac` ENUM('tuoi_nuoc', 'bon_phan', 'cat_tia', 'khac') COLLATE utf8mb4_unicode_ci DEFAULT 'tuoi_nuoc',
  `thu_trong_tuan` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gio_nhac` TIME NOT NULL,
  `ghi_chu` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_bat` TINYINT(1) DEFAULT 1,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `garden_id` (`garden_id`),
  CONSTRAINT `care_reminders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `care_reminders_ibfk_2` FOREIGN KEY (`garden_id`) REFERENCES `user_garden` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Care Reminders)


-- =========================================================================
-- 10. BẢNG ĐÁNH GIÁ SẢN PHẨM (PRODUCT_REVIEWS)
-- =========================================================================
CREATE TABLE `product_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `so_sao` INT DEFAULT NULL,
  `binh_luan` TEXT DEFAULT NULL,
  `ngay_danh_gia` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK (`so_sao` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Product Reviews)


-- =========================================================================
-- 11. BẢNG LỊCH SỬ CHAT VỚI AI (CHAT_HISTORY)
-- =========================================================================
CREATE TABLE `chat_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `cau_hoi` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `cau_tra_loi` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Chat History)


-- =========================================================================
-- 12. BẢNG ĐƠN HÀNG (ORDERS)
-- =========================================================================
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `coupon_id` INT DEFAULT NULL,
  `tong_tien_hang` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `so_tien_giam_gia` DECIMAL(10,2) DEFAULT 0.00,
  `tong_thanh_toan` DECIMAL(10,2) GENERATED ALWAYS AS (`tong_tien_hang` - `so_tien_giam_gia`) STORED,
  `trang_thai` ENUM('cho_duyet', 'dang_xu_ly', 'dang_giao', 'da_giao', 'da_huy', 'da_thu/da_xu_ly', 'da_thu/da_xac_nhan') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_duyet',
  `dia_chi_giao_hang` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_dat_hang` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn dữ liệu mẫu cho bảng Orders
INSERT INTO `orders` (`id`, `user_id`, `coupon_id`, `tong_tien_hang`, `so_tien_giam_gia`, `trang_thai`, `dia_chi_giao_hang`, `ngay_dat_hang`) VALUES
(1, 2, NULL, 0.00, 0.00, 'cho_duyet', '123 Đường ABC, Quận 1', '2026-07-10 02:50:25');


-- =========================================================================
-- 13. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
-- =========================================================================
CREATE TABLE `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT DEFAULT NULL,
  `product_id` INT DEFAULT NULL,
  `so_luong` INT NOT NULL,
  `gia_luc_mua` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_chk_1` CHECK (`so_luong` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Order Items)


-- =========================================================================
-- 14. BẢNG CHẨN ĐOÁN BỆNH CÂY (PLANT_DIAGNOSES)
-- =========================================================================
CREATE TABLE `plant_diagnoses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `image_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ket_qua` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `san_pham_goi_y` JSON DEFAULT NULL,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `plant_diagnoses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Plant Diagnoses)


-- =========================================================================
-- 15. BẢNG ĐIỂM THƯỞNG TÍCH LŨY (USERS_POINTS)
-- =========================================================================
CREATE TABLE `users_points` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `diem` INT NOT NULL DEFAULT 0,
  `ly_do` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_points_user_date` (`user_id`, `ngay_tao`),
  CONSTRAINT `users_points_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Users Points)


-- =========================================================================
-- 16. BẢNG TRỒNG CÂY ẢO MINIGAME (VIRTUAL_PLANTS)
-- =========================================================================
CREATE TABLE `virtual_plants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ten_cay` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Cay ao cua toi',
  `cap_do` INT DEFAULT 1,
  `tien_trinh` INT DEFAULT 0,
  `luong_nuoc` INT DEFAULT 0,
  `luong_phan_bon` INT DEFAULT 0,
  `lan_tuoi_cuoi` DATETIME DEFAULT NULL,
  `lan_bon_phan_cuoi` DATETIME DEFAULT NULL,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_virtual_plant_user` (`user_id`),
  CONSTRAINT `virtual_plants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Virtual Plants)


-- =========================================================================
-- 17. BẢNG SỰ KIỆN KHUYẾN MÃI (PROMOTIONAL_EVENTS)
-- =========================================================================
CREATE TABLE `promotional_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tieu_de` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hinh_anh_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coupon_id` INT DEFAULT NULL,
  `ngay_bat_dau` DATETIME DEFAULT NULL,
  `ngay_ket_thuc` DATETIME DEFAULT NULL,
  `dang_hien_thi` TINYINT(1) DEFAULT 1,
  `ngay_tao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `promotional_events_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu mẫu cho Promotional Events)