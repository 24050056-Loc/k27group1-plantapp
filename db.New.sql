-- =========================================================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU CỦA PLANT SHOP (TỔNG HỢP TOÀN BỘ DỮ LIỆU THỰC TẾ)
-- Ngày xuất: 17:30:07 13/9/2026
-- =========================================================================
CREATE DATABASE IF NOT EXISTS `tree_shop_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tree_shop_db`;

-- Tắt tạm thời kiểm tra khóa ngoại và thiết lập charset utf8mb4
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa tất cả các bảng cũ để làm mới cấu trúc
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `promotional_events`;
DROP TABLE IF EXISTS `user_coupons`;
DROP TABLE IF EXISTS `event_progress`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `wishlist`;
DROP TABLE IF EXISTS `product_reviews`;
DROP TABLE IF EXISTS `plant_diagnoses`;
DROP TABLE IF EXISTS `care_reminders`;
DROP TABLE IF EXISTS `user_garden`;
DROP TABLE IF EXISTS `users_points`;
DROP TABLE IF EXISTS `virtual_plants`;
DROP TABLE IF EXISTS `explore_posts`;
DROP TABLE IF EXISTS `explore_comments`;
DROP TABLE IF EXISTS `explore_likes`;
DROP TABLE IF EXISTS `chat_history`;
DROP TABLE IF EXISTS `blogs`;

-- =========================================================================
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- =========================================================================
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ho_ten` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `so_dien_thoai` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vai_tro` enum('admin','quan_ly','khach_hang','khach_vang_lai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'khach_hang',
  `dang_hoat_dong` tinyint(1) DEFAULT '1',
  `last_seen` datetime DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `users` (7 bản ghi)
INSERT INTO `users` (`id`, `ten_dang_nhap`, `mat_khau`, `email`, `google_id`, `ho_ten`, `dia_chi`, `so_dien_thoai`, `vai_tro`, `dang_hoat_dong`, `last_seen`, `ngay_tao`, `avatar`) VALUES
(1, 'admin', '$2b$10$FE4oyUqeEhGtrn/veXFavOiiBAYIZm6RCZo/pzo7t9rEXJ41r2Bna', 'admin@treeshop.com', NULL, 'Quản trị viên', NULL, NULL, 'admin', 1, NULL, '2026-07-10 02:50:25', NULL),
(2, 'khach01', '123456', 'khach01@gmail.com', NULL, 'Nguyễn Văn Khách', NULL, NULL, 'khach_hang', 1, NULL, '2026-07-10 02:50:25', NULL),
(3, 'tai67', '$2b$10$dnIufXOT8t56Y4kmcjPaE.hkFxOlYevMfG8AJnLEHUAP6kzV4ymle', 'thiemtai2@gmail.com', NULL, 'Thiềm Nguyễn Minh Tài', 'Bình Chuẩn 4, Thành phố Hồ Chí Minh, Hồ Chí Minh, Việt Nam', '0398162575', 'khach_hang', 1, '2026-09-13 13:11:23', '2026-09-08 11:22:08', 'http://192.168.2.64:8080/uploads/avatars/avatar_3_1789279592570.jpeg'),
(4, 'tai123', '$2b$10$/eL.yxEOx8jhTx23Vm6LQuMWzuJ4Y3x56cm0u3/5tPQqmElO4EcWW', '24050071@student.bdu.edu.vn', NULL, 'tnmt', '63, Đường Hoàng Hoa Thám, Thành phố Hồ Chí Minh, Hồ Chí Minh, Việt Nam', NULL, 'admin', 1, '2026-09-13 17:26:46', '2026-09-09 07:48:33', 'http://192.168.2.64:8080/uploads/avatars/avatar_4_1789276614715.jpeg'),
(5, 'tai97', '$2b$10$tT8OKEq/r5tKgUBgd80GQeg/sB.RcS1OQ88Ti8vMl85DUv6t2ANYC', 'thiemtai890@gmail.com', NULL, 'TnMt', NULL, NULL, 'khach_hang', 1, '2026-09-13 13:34:58', '2026-09-09 08:18:37', NULL),
(6, 'tai76', '$2b$10$zUxA1efwtvS74YU5dYDc4e5rrsX6Kp99Csb24OfloAypd81ajMzI6', 'taithiem59@gmail.com', NULL, 'tNmT', NULL, NULL, 'khach_hang', 1, '2026-09-13 14:50:43', '2026-09-09 08:24:50', NULL),
(13, 'tai66', '$2b$10$LEW.M1Ff.nGR9/0zri5KK.OymH/DXDVUbnFzjUmh.FZBUnw1r/fYG', 'taithiem64@gmail.com', NULL, NULL, NULL, '0398162575', 'khach_hang', 1, '2026-09-13 15:05:00', '2026-09-13 15:03:07', NULL);


-- =========================================================================
-- 2. BẢNG DANH MỤC SẢN PHẨM (CATEGORIES)
-- =========================================================================
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_danh_muc` (`ten_danh_muc`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `categories` (3 bản ghi)
INSERT INTO `categories` (`id`, `ten_danh_muc`, `mo_ta`, `ngay_tao`) VALUES
(1, 'Cây Cảnh', 'Cây để bàn, trang trí nội thất', '2026-07-10 02:50:25'),
(2, 'Cây Giống', 'Cây giống ăn trái, rau màu', '2026-07-10 02:50:25'),
(4, 'Combo Starter Kit', 'Các gói combo cây trồng tiết kiệm trọn bộ bao gồm cây giống, đất trồng và chậu cảnh', '2026-09-13 15:20:31');


-- =========================================================================
-- 3. BẢNG SẢN PHẨM (PRODUCTS)
-- =========================================================================
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `ten_san_pham` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_khoa_hoc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `gia_tien` decimal(10,2) NOT NULL,
  `so_luong_kho` int DEFAULT '0',
  `hinh_anh_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_kinh_doanh` tinyint(1) DEFAULT '1',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ar_model_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dac_tinh` json DEFAULT NULL,
  `is_combo` tinyint(1) DEFAULT '0',
  `original_price` decimal(10,2) DEFAULT NULL,
  `discount_percent` int DEFAULT '0',
  `combo_items` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_products_category_price` (`category_id`,`gia_tien`),
  KEY `idx_products_name` (`ten_san_pham`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_chk_1` CHECK ((`gia_tien` >= 0)),
  CONSTRAINT `products_chk_2` CHECK ((`so_luong_kho` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `products` (28 bản ghi)
INSERT INTO `products` (`id`, `category_id`, `ten_san_pham`, `ten_khoa_hoc`, `mo_ta`, `gia_tien`, `so_luong_kho`, `hinh_anh_url`, `dang_kinh_doanh`, `ngay_tao`, `ngay_cap_nhat`, `ar_model_url`, `dac_tinh`, `is_combo`, `original_price`, `discount_percent`, `combo_items`) VALUES
(1, 1, 'Cây Xương Rồng', NULL, 'Chịu hạn cực tốt. Chi tiết: Tưới nước 1 lần/tuần.', '50000.00', 100, 'images/cactus.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(2, 1, 'Cây Lưỡi Hổ', NULL, 'Thanh lọc không khí. Chi tiết: Ưa bóng râm.', '120000.00', 49, 'images/SnakePlant.jpg', 1, '2026-07-10 02:50:25', '2026-09-08 14:35:45', NULL, NULL, 0, NULL, 0, NULL),
(3, 1, 'Cây Sen Đá', NULL, 'Tượng trưng cho tình yêu vĩnh cửu.', '80000.00', 80, 'images/Succulent.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(4, 1, 'Cây Bàng Đài Loan', NULL, 'Tạo không gian xanh mát hiện đại.', '250000.00', 10, 'images/cay_bang_dai_loan.jpg', 1, '2026-07-10 02:50:25', '2026-09-12 22:56:27', NULL, NULL, 0, NULL, 0, NULL),
(5, 2, 'Giống Cây Cà Chua', NULL, 'Khỏe mạnh, trái sai. Thu hoạch sau 70-80 ngày.', '15000.00', 500, 'images/Cay_Ca_Chua.jpg', 1, '2026-07-10 02:50:25', '2026-09-12 21:16:01', NULL, NULL, 0, NULL, 0, NULL),
(6, 2, 'Giống Ớt Chỉ Thiên', NULL, 'Vị cay nồng, năng suất cao.', '12000.00', 300, 'images/Ot_Chi_Thien.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(7, 2, 'Giống Hoa Hướng Dương', NULL, 'Bông to rực rỡ. Nở hoa sau 60 ngày.', '25000.00', 150, 'images/Huong-Duong.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(8, 2, 'Cây Giống Chanh Dây', NULL, 'Leo khỏe, che mát sân thượng.', '45000.00', 100, 'images/Chanh_Day.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(9, 2, 'Cây Giống Cam Sành', NULL, 'Vị ngọt thanh, vỏ dày.', '65000.00', 60, 'images/CamSanh.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(10, 2, 'Cây Giống Xoài Cát', NULL, 'Xoài Cát Hòa Lộc nổi tiếng.', '85000.00', 40, 'images/XoaiCat.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(11, 2, 'Cây Mít Thái', NULL, 'Trái quanh năm, múi dày giòn.', '70000.00', 45, 'images/MitThai.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(12, 2, 'Cây Chôm Chôm Thái', NULL, 'Trái to, râu dài, cơm dày.', '90000.00', 30, 'images/ChomChomThai.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(13, 2, 'Cây Nhãn Ido', NULL, 'Hạt nhỏ, cơm dày, độ đường cao.', '75000.00', 35, 'images/NhanIdo.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(14, 2, 'Sầu Riêng Ri6', NULL, 'Cơm vàng hạt lép, mùi thơm nồng.', '150000.00', 18, 'images/SauRiengRi6.jpg', 1, '2026-07-10 02:50:25', '2026-09-13 15:55:05', NULL, NULL, 0, NULL, 0, NULL),
(15, 2, 'Cây Măng Cụt', NULL, 'Vị chua ngọt thanh khiết.', '110000.00', 20, 'images/CayMangCut.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(16, 2, 'Cây Vú Sữa Lò Rèn', NULL, 'Đặc sản miền Tây.', '80000.00', 30, 'images/VuSuaLoRen.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(17, 2, 'Cây Sơ Ri', NULL, 'Hàm lượng Vitamin C cực cao.', '55000.00', 50, 'images/CaySoRi.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(18, 2, 'Mãng Cầu Xiêm', NULL, 'Trái to, vị chua ngọt giải nhiệt.', '60000.00', 40, 'images/MangCauXiem.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(19, 2, 'Dừa Xiêm Lùn', NULL, 'Nước ngọt, cây thấp dễ hái.', '45000.00', 100, 'images/DuaXiemLun.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(20, 2, 'Bưởi Da Xanh', NULL, 'Ruột hồng, tép bó, ngọt thanh.', '95000.00', 30, 'images/BuoiDaXanh.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(21, 2, 'Cây Cà Na Thái', NULL, 'Chịu ngập nước tốt.', '50000.00', 50, 'images/CayCaNaThai.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(22, 2, 'Cây Hồng Quân', NULL, 'Trái chín tím đỏ, gợi nhớ tuổi thơ.', '65000.00', 15, 'images/CayHongQuan.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(23, 2, 'Dâu Xanh (Dâu Da)', NULL, 'Trái mọc thành chùm từ thân.', '60000.00', 25, 'images/CayDauXanh.jpg', 1, '2026-07-10 02:50:25', '2026-07-10 02:50:25', NULL, NULL, 0, NULL, 0, NULL),
(24, 2, 'Cây Chanh Giấy', NULL, 'Vỏ mỏng, nhiều nước, rất thơm.', '35000.00', 120, 'images/CayChanhGiay.jpg', 1, '2026-07-10 02:50:25', '2026-09-12 21:50:55', NULL, NULL, 0, NULL, 0, NULL),
(26, 4, 'Starter Kit Nhiệt Đới', 'Plant Combo Kit', 'Cây giống Xoài Cát + Đất trồng cao cấp + Chậu sứ cao cấp', '349000.00', 100, 'images/ComboCayNhietDoi.jpg', 1, '2026-09-13 15:20:31', '2026-09-13 15:36:45', NULL, '{"key":"sk1","tag":"Bán chạy","emoji":"🌴","items":["🌿 Cây giống Xoài Cát","🌱 Đất trồng 5L","🪴 Chậu sứ Ø20cm"],"discount":22,"is_combo":true,"tagColor":"#F4A261","salePrice":349000,"gradientTo":"#2D6A4F","gradientFrom":"#1B4332","originalPrice":450000}', 1, '450000.00', 22, '["🌿 Cây giống Xoài Cát","🌱 Đất trồng 5L","🪴 Chậu sứ Ø20cm"]'),
(27, 4, 'Starter Kit Mini Cactus', 'Plant Combo Kit', '3 cây Xương rồng + Đất cát + Bộ chậu mini siêu cute', '199000.00', 100, 'images/ComBoCayXuongRongMini.jpg', 1, '2026-09-13 15:20:31', '2026-09-13 15:36:45', NULL, '{"key":"sk2","tag":"Mới nhất","emoji":"🌵","items":["🌵 3 cây Xương rồng","🌱 Đất cát 2L","🪴 Bộ chậu 3 cái"],"discount":29,"is_combo":true,"tagColor":"#2E7D32","salePrice":199000,"gradientTo":"#C27A4A","gradientFrom":"#7B4E2E","originalPrice":280000}', 1, '280000.00', 29, '["🌵 3 cây Xương rồng","🌱 Đất cát 2L","🪴 Bộ chậu 3 cái"]'),
(28, 4, 'Starter Kit Thảo Mộc', 'Plant Combo Kit', 'Bộ 5 cây thảo mộc + Đất hữu cơ + Chậu tái chế xanh', '289000.00', 99, 'images/ComboHoaThaoMoc.jpg', 1, '2026-09-13 15:20:31', '2026-09-13 15:55:05', NULL, '{"key":"sk3","tag":"Tiết kiệm","emoji":"🌿","items":["🌿 5 cây thảo mộc","🌱 Đất hữu cơ 3L","🪴 Chậu tái chế xanh"],"discount":26,"is_combo":true,"tagColor":"#558B2F","salePrice":289000,"gradientTo":"#386641","gradientFrom":"#1A3A2A","originalPrice":390000}', 1, '390000.00', 26, '["🌿 5 cây thảo mộc","🌱 Đất hữu cơ 3L","🪴 Chậu tái chế xanh"]'),
(29, 4, 'Starter Kit Hoa Phòng Khách', 'Plant Combo Kit', 'Hoa Hướng Dương + Đất giàu dinh dưỡng + Chậu gốm trang trí', '399000.00', 100, 'images/ComboHoaPhongKhach.jpg', 1, '2026-09-13 15:20:31', '2026-09-13 15:36:45', NULL, '{"key":"sk4","tag":"Hot Deal","emoji":"🌻","items":["🌻 Hoa Hướng Dương","🌱 Đất hữu cơ cao cấp","🪴 Chậu gốm trang trí"],"discount":23,"is_combo":true,"tagColor":"#E53935","salePrice":399000,"gradientTo":"#9C5A00","gradientFrom":"#4A2600","originalPrice":520000}', 1, '520000.00', 23, '["🌻 Hoa Hướng Dương","🌱 Đất hữu cơ cao cấp","🪴 Chậu gốm trang trí"]');


-- =========================================================================
-- 4. BẢNG MÃ GIẢM GIÁ (COUPONS)
-- =========================================================================
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_giam_gia` enum('phan_tram','so_tien_co_dinh') COLLATE utf8mb4_unicode_ci DEFAULT 'phan_tram',
  `gia_tri_giam` decimal(10,2) NOT NULL,
  `dang_ap_dung` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_code` (`ma_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `coupons`)


-- =========================================================================
-- 5. BẢNG SỰ KIỆN KHUYẾN MÃI (PROMOTIONAL_EVENTS)
-- =========================================================================
CREATE TABLE `promotional_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `hinh_anh_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `ngay_bat_dau` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `dang_hien_thi` tinyint(1) DEFAULT '1',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `promotional_events_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `promotional_events`)


-- =========================================================================
-- 6. BẢNG MÃ GIẢM GIÁ CỦA NGƯỜI DÙNG (USER_COUPONS)
-- =========================================================================
CREATE TABLE `user_coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('phan_tram','so_tien_co_dinh') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `source_stage` int DEFAULT NULL,
  `status` enum('available','used','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `used_order_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_coupon_code` (`code`),
  KEY `idx_user_coupon_owner` (`user_id`),
  KEY `idx_user_coupon_status` (`status`),
  KEY `idx_user_coupon_expiry` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `user_coupons` (5 bản ghi)
INSERT INTO `user_coupons` (`id`, `user_id`, `code`, `label`, `description`, `discount_type`, `discount_value`, `source_stage`, `status`, `created_at`, `expires_at`, `used_at`, `used_order_id`) VALUES
(5, 999990, 'TCODE001', 'Test', NULL, 'phan_tram', '10.00', NULL, 'available', '2026-09-12 15:33:13', '2026-09-19 15:33:13', NULL, NULL),
(8, 5, 'PLANTMTZF3QQ1FCDCC25', 'Voucher 20% OFF', 'Cây đang phát triển tốt!', 'phan_tram', '20.00', 2, 'available', '2026-09-13 13:13:02', '2026-09-20 06:13:02', NULL, NULL),
(9, 5, 'PLANTMTZFUS4245B272A', 'Voucher 10% OFF', 'Mới nảy mầm, cần được chăm sóc.', 'phan_tram', '10.00', 1, 'available', '2026-09-13 13:34:04', '2026-09-20 06:34:04', NULL, NULL),
(10, 6, 'PLANTMTZIJB72516D0AB', 'Voucher 20% OFF', 'Cây đang phát triển tốt!', 'phan_tram', '20.00', 2, 'available', '2026-09-13 14:49:08', '2026-09-20 07:49:08', NULL, NULL),
(11, 13, 'PLANTMTZJ2A26F6831D9', 'Voucher 20% OFF', 'Cây đang phát triển tốt!', 'phan_tram', '20.00', 2, 'available', '2026-09-13 15:03:53', '2026-09-20 08:03:53', NULL, NULL);


-- =========================================================================
-- 7. BẢNG TIẾN TRÌNH SỰ KIỆN (EVENT_PROGRESS)
-- =========================================================================
CREATE TABLE `event_progress` (
  `user_id` int NOT NULL,
  `selected_seed` varchar(100) DEFAULT NULL,
  `stage` tinyint NOT NULL DEFAULT '0',
  `stage_start_time` bigint NOT NULL,
  `time_reduced` bigint NOT NULL DEFAULT '0',
  `water_turns` int NOT NULL DEFAULT '3',
  `fert_turns` int NOT NULL DEFAULT '1',
  `water_max` int NOT NULL DEFAULT '3',
  `fert_max` int NOT NULL DEFAULT '1',
  `missions` json NOT NULL,
  `claimed_vouchers` json NOT NULL,
  `notif_on` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_reset_day` bigint NOT NULL DEFAULT '0',
  `reset_reason` varchar(50) NOT NULL DEFAULT 'daily',
  `last_daily_reset_date` date DEFAULT NULL,
  `last_seed_claim_date` date DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dữ liệu hiện có cho bảng `event_progress` (5 bản ghi)
INSERT INTO `event_progress` (`user_id`, `selected_seed`, `stage`, `stage_start_time`, `time_reduced`, `water_turns`, `fert_turns`, `water_max`, `fert_max`, `missions`, `claimed_vouchers`, `notif_on`, `updated_at`, `last_reset_day`, `reset_reason`, `last_daily_reset_date`, `last_seed_claim_date`) VALUES
(3, 'sau-rieng-ri6', 1, 1789279506325, 0, 6, 2, 6, 2, '[true,true,true,true,true]', '[]', 0, '2026-09-13 13:09:13', 0, 'daily', '2026-09-13', '2026-09-13'),
(4, NULL, 0, 1789274563628, 0, 3, 1, 3, 1, '[false,false,false,false,true]', '[]', 1, '2026-09-13 16:04:07', 0, 'daily', '2026-09-13', '2026-09-13'),
(5, NULL, 0, 1789281244760, 0, 0, 0, 6, 2, '[true,true,true,true,true]', '[2,1]', 0, '2026-09-13 13:34:04', 0, 'voucher_claim_tree_reset', '2026-09-13', '2026-09-13'),
(6, 'bang-dai-loan', 1, 1789285753158, 3600000, 0, 0, 6, 2, '[true,true,true,true,true]', '[2]', 0, '2026-09-13 14:49:14', 0, 'daily', '2026-09-13', '2026-09-13'),
(13, NULL, 0, 1789286633373, 0, 2, 0, 6, 2, '[true,true,true,true,true]', '[]', 0, '2026-09-13 15:03:53', 0, 'seed_reset', '2026-09-13', '2026-09-13');


-- =========================================================================
-- 8. BẢNG ĐƠN HÀNG (ORDERS)
-- =========================================================================
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `coupon_id` int DEFAULT NULL,
  `tong_tien_hang` decimal(10,2) NOT NULL DEFAULT '0.00',
  `so_tien_giam_gia` decimal(10,2) DEFAULT '0.00',
  `tong_thanh_toan` decimal(10,2) GENERATED ALWAYS AS ((`tong_tien_hang` - `so_tien_giam_gia`)) STORED,
  `trang_thai` enum('cho_duyet','cho_xu_ly','dang_xu_ly','dang_giao','da_giao','hoan_thanh','da_huy','da_thu/da_xu_ly','da_thu/da_xac_nhan') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_xu_ly',
  `dia_chi_giao_hang` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_dat_hang` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ma_giam_gia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `orders` (5 bản ghi)
INSERT INTO `orders` (`id`, `user_id`, `coupon_id`, `tong_tien_hang`, `so_tien_giam_gia`, `tong_thanh_toan`, `trang_thai`, `dia_chi_giao_hang`, `ngay_dat_hang`, `ma_giam_gia`) VALUES
(1, 2, NULL, '0.00', '0.00', '0.00', 'hoan_thanh', '123 Đường ABC, Quận 1', '2026-07-10 02:50:25', NULL),
(7, 4, NULL, '250000.00', '0.00', '250000.00', 'da_huy', '63, Đường Hoàng Hoa Thám, Thành phố Hồ Chí Minh, Hồ Chí Minh, Việt Nam', '2026-09-09 07:51:28', NULL),
(19, 1, NULL, '200000.00', '20000.00', '180000.00', 'hoan_thanh', '123 Test', '2026-09-12 15:34:12', NULL),
(20, 1, NULL, '200000.00', '30000.00', '170000.00', 'cho_duyet', '123 Test', '2026-09-12 15:34:12', NULL),
(21, 4, NULL, '439000.00', '0.00', '439000.00', 'cho_xu_ly', 'Bình Chuẩn 4, Thành phố Hồ Chí Minh, Hồ Chí Minh, Việt Nam', '2026-09-13 15:55:05', NULL);


-- =========================================================================
-- 9. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
-- =========================================================================
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `so_luong` int NOT NULL,
  `gia_luc_mua` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_chk_1` CHECK ((`so_luong` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `order_items` (5 bản ghi)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `so_luong`, `gia_luc_mua`) VALUES
(8, 7, 4, 1, '250000.00'),
(19, 19, 1, 1, '200000.00'),
(20, 20, 1, 1, '200000.00'),
(21, 21, 14, 1, '150000.00'),
(22, 21, 28, 1, '289000.00');


-- =========================================================================
-- 10. BẢNG LỊCH SỬ TRẠNG THÁI ĐƠN HÀNG (ORDER_STATUS_HISTORY)
-- =========================================================================
CREATE TABLE `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(50) NOT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ghi_chu` text,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dữ liệu hiện có cho bảng `order_status_history` (5 bản ghi)
INSERT INTO `order_status_history` (`id`, `order_id`, `old_status`, `new_status`, `changed_by`, `changed_at`, `ghi_chu`) VALUES
(1, 1, 'cho_duyet', 'dang_giao', NULL, '2026-09-12 22:55:45', 'Admin chuyển trạng thái'),
(2, 1, 'dang_giao', 'hoan_thanh', NULL, '2026-09-12 22:56:27', 'Admin chuyển trạng thái'),
(3, 7, 'cho_duyet', 'da_huy', NULL, '2026-09-12 22:56:27', 'Admin chuyển trạng thái'),
(4, 19, 'cho_duyet', 'dang_giao', 4, '2026-09-12 23:02:49', 'Admin chuyển trạng thái'),
(5, 19, 'dang_giao', 'hoan_thanh', 4, '2026-09-12 23:03:34', 'Admin chuyển trạng thái');


-- =========================================================================
-- 11. BẢNG GIỎ HÀNG (CART)
-- =========================================================================
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_chk_1` CHECK ((`so_luong` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `cart` (1 bản ghi)
INSERT INTO `cart` (`id`, `user_id`, `product_id`, `so_luong`, `ngay_tao`) VALUES
(23, 3, 14, 1, '2026-09-12 15:19:12');


-- =========================================================================
-- 12. BẢNG DANH SÁCH YÊU THÍCH (WISHLIST)
-- =========================================================================
CREATE TABLE `wishlist` (
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `ngay_them` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `wishlist`)


-- =========================================================================
-- 13. BẢNG ĐÁNH GIÁ SẢN PHẨM (PRODUCT_REVIEWS)
-- =========================================================================
CREATE TABLE `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `so_sao` int DEFAULT NULL,
  `binh_luan` text COLLATE utf8mb4_unicode_ci,
  `ngay_danh_gia` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `product_reviews`)


-- =========================================================================
-- 14. BẢNG CHẨN ĐOÁN BỆNH CÂY (PLANT_DIAGNOSES)
-- =========================================================================
CREATE TABLE `plant_diagnoses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ket_qua` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `san_pham_goi_y` json DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `plant_diagnoses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `plant_diagnoses`)


-- =========================================================================
-- 15. BẢNG NHẮC NHỞ CHĂM SÓC CÂY (CARE_REMINDERS)
-- =========================================================================
CREATE TABLE `care_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `garden_id` int NOT NULL,
  `loai_nhac` enum('tuoi_nuoc','bon_phan','cat_tia','khac') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'tuoi_nuoc',
  `thu_trong_tuan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gio_nhac` time NOT NULL,
  `ghi_chu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dang_bat` tinyint(1) DEFAULT '1',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `garden_id` (`garden_id`),
  CONSTRAINT `care_reminders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `care_reminders_ibfk_2` FOREIGN KEY (`garden_id`) REFERENCES `user_garden` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `care_reminders`)


-- =========================================================================
-- 16. BẢNG VƯỜN CỦA TÔI (USER_GARDEN)
-- =========================================================================
CREATE TABLE `user_garden` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `ten_cay` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hinh_anh_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_them` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `user_garden_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_garden_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `user_garden`)


-- =========================================================================
-- 17. BẢNG ĐIỂM THƯỞNG TÍCH LŨY (USERS_POINTS)
-- =========================================================================
CREATE TABLE `users_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `diem` int NOT NULL DEFAULT '0',
  `ly_do` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_points_user_date` (`user_id`,`ngay_tao`),
  CONSTRAINT `users_points_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `users_points`)


-- =========================================================================
-- 18. BẢNG TRỒNG CÂY ẢO MINIGAME (VIRTUAL_PLANTS)
-- =========================================================================
CREATE TABLE `virtual_plants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ten_cay` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Cay ao cua toi',
  `cap_do` int DEFAULT '1',
  `tien_trinh` int DEFAULT '0',
  `luong_nuoc` int DEFAULT '0',
  `luong_phan_bon` int DEFAULT '0',
  `lan_tuoi_cuoi` datetime DEFAULT NULL,
  `lan_bon_phan_cuoi` datetime DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_virtual_plant_user` (`user_id`),
  CONSTRAINT `virtual_plants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `virtual_plants`)


-- =========================================================================
-- 19. BẢNG BÀI VIẾT KHÁM PHÁ (EXPLORE_POSTS)
-- =========================================================================
CREATE TABLE `explore_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_tag` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'khoe_cay',
  `plant_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` tinyint DEFAULT '5',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `images` json DEFAULT NULL,
  `likes_count` int DEFAULT '0',
  `comments_count` int DEFAULT '0',
  `da_mua_hang` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `explore_posts` (9 bản ghi)
INSERT INTO `explore_posts` (`id`, `user_id`, `category_tag`, `plant_name`, `rating`, `content`, `images`, `likes_count`, `comments_count`, `da_mua_hang`, `created_at`, `updated_at`) VALUES
(1, 1, 'danh_gia_hot', 'Sen Đá Ngọc Bích (Jade Plant)', 5, 'Cây nhận được tươi xanh và mộng nước lắm mọi người ơi! Đóng gói cực kỳ cẩn thận, có kèm cả hướng dẫn tưới nước nữa. Sẽ tiếp tục ủng hộ shop...', '["https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80"]', 24, 4, 1, '2026-09-12 10:24:55', '2026-09-13 12:40:50'),
(2, 1, 'khoe_cay', 'Cây Bàng Đài Loan', 5, 'Góc ban công xanh mát vừa được trang hoàng thêm cây bàng lá nhỏ. Cây khỏe, phát triển rất nhanh luôn nha mọi người!', '["https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80"]', 45, 8, 1, '2026-09-12 10:24:55', '2026-09-12 10:24:55'),
(3, 1, 'meo_cham_cay', 'Lưỡi Hổ Thái', 5, 'Mẹo nhỏ cho các bạn mới trồng Lưỡi Hổ: Không nên tưới quá nhiều nước, 1-2 tuần tưới 1 lần là cây sống rất khỏe và lọc không khí cực tốt nha!', '["https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80"]', 89, 12, 0, '2026-09-12 10:24:55', '2026-09-12 10:24:55'),
(4, 4, 'khoe_cay', NULL, 5, 'test', '[]', 0, 1, 1, '2026-09-13 12:17:18', '2026-09-13 12:20:42'),
(5, 4, 'khoe_cay', NULL, 5, 'tesst', '[]', 0, 0, 1, '2026-09-13 12:20:30', '2026-09-13 12:21:10'),
(6, 4, 'khoe_cay', NULL, 5, 'Cây sen đá mới mua cực kỳ xinh xắn!', '["/uploads/posts/post_4_1789278087812_529244.jpg"]', 0, 0, 1, '2026-09-13 12:41:27', '2026-09-13 12:41:27'),
(7, 4, 'khoe_cay', NULL, 5, 'test', '["/uploads/posts/post_4_1789278546372_130290.jpeg"]', 1, 1, 1, '2026-09-13 12:49:06', '2026-09-13 12:49:14'),
(8, 3, 'khoe_cay', NULL, 5, 'test', '["/uploads/posts/post_3_1789279844112_840575.jpeg"]', 1, 0, 1, '2026-09-13 13:10:44', '2026-09-13 16:10:13'),
(9, 4, 'khoe_cay', NULL, 5, 'test', '["/uploads/posts/post_4_1789290930653_592304.jpeg"]', 1, 3, 1, '2026-09-13 16:15:30', '2026-09-13 16:16:24');


-- =========================================================================
-- 20. BẢNG BÌNH LUẬN BÀI VIẾT (EXPLORE_COMMENTS)
-- =========================================================================
CREATE TABLE `explore_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `explore_comments` (6 bản ghi)
INSERT INTO `explore_comments` (`id`, `post_id`, `user_id`, `content`, `created_at`, `parent_id`) VALUES
(1, 4, 1, '123', '2026-09-13 12:20:42', NULL),
(2, 1, 4, 'Cây này tưới nước thế nào ạ?', '2026-09-13 12:40:50', NULL),
(3, 7, 4, '123', '2026-09-13 12:49:14', NULL),
(4, 9, 4, '1234', '2026-09-13 16:15:43', NULL),
(5, 9, 4, '@tnmt 123', '2026-09-13 16:15:52', 4),
(6, 9, 4, '12345', '2026-09-13 16:16:01', NULL);


-- =========================================================================
-- 21. BẢNG LƯỢT THÍCH BÀI VIẾT (EXPLORE_LIKES)
-- =========================================================================
CREATE TABLE `explore_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_post_like` (`post_id`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu hiện có cho bảng `explore_likes` (3 bản ghi)
INSERT INTO `explore_likes` (`id`, `post_id`, `user_id`, `created_at`) VALUES
(3, 7, 4, '2026-09-13 12:49:10'),
(5, 8, 4, '2026-09-13 16:10:13'),
(9, 9, 4, '2026-09-13 16:16:24');


-- =========================================================================
-- 22. BẢNG LỊCH SỬ CHAT AI (CHAT_HISTORY)
-- =========================================================================
CREATE TABLE `chat_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `cau_hoi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cau_tra_loi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `chat_history`)


-- =========================================================================
-- 23. BẢNG BÀI VIẾT BLOG CẨM NANG (BLOGS)
-- =========================================================================
CREATE TABLE `blogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tom_tat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `noi_dung` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hinh_anh_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `danh_muc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_hien_thi` tinyint(1) DEFAULT '1',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_blogs_slug` (`slug`),
  KEY `idx_blogs_category` (`danh_muc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Chưa có dữ liệu cho bảng `blogs`)


-- =========================================================================
-- BẬT LẠI KIỂM TRA KHÓA NGOẠI VÀ HOÀN TẤT NẠP DỮ LIỆU
-- =========================================================================
SET FOREIGN_KEY_CHECKS = 1;

