-- 1. Khởi tạo Cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS tree_shop_db;
USE tree_shop_db;

-- Xóa các bảng cũ để làm mới cấu trúc (Theo thứ tự tránh lỗi khóa ngoại)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS momo, user_plants, minigame_users, promotional_events, cart, wishlist, product_reviews, order_items, orders, coupons, users, products, categories;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Bảng Danh mục
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
    mo_ta TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Sản phẩm (Đổi tên thành products để khớp khóa ngoại)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    ten_san_pham VARCHAR(255) NOT NULL,
    ten_khoa_hoc VARCHAR(255),
    mo_ta TEXT,
    gia_tien DECIMAL(10, 2) NOT NULL CHECK (gia_tien >= 0),
    so_luong_kho INT DEFAULT 0 CHECK (so_luong_kho >= 0),
    hinh_anh_url VARCHAR(255),
    dang_kinh_doanh BOOLEAN DEFAULT TRUE,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Người dùng
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    ho_ten VARCHAR(100),
    dia_chi TEXT,
    so_dien_thoai VARCHAR(20),
    vai_tro ENUM('admin', 'quan_ly', 'khach_hang', 'khach_vang_lai') DEFAULT 'khach_hang',
    dang_hoat_dong BOOLEAN DEFAULT TRUE,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Mã giảm giá
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_code VARCHAR(20) NOT NULL UNIQUE,
    loai_giam_gia ENUM('phan_tram', 'so_tien_co_dinh') DEFAULT 'phan_tram',
    gia_tri_giam DECIMAL(10, 2) NOT NULL,
    dang_ap_dung BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Bảng Đơn hàng (Đã gộp cấu trúc từ bảng order và orders cũ)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    coupon_id INT,
    tong_tien_hang DECIMAL(10, 2) NOT NULL DEFAULT 0,
    so_tien_giam_gia DECIMAL(10, 2) DEFAULT 0,
    tong_thanh_toan DECIMAL(10, 2) AS (tong_tien_hang - so_tien_giam_gia) STORED,
    trang_thai ENUM('cho_duyet', 'dang_xu_ly', 'dang_giao', 'da_giao', 'da_huy', 'da_thu/da_xu_ly', 'da_thu/da_xac_nhan', 'cho_thanh_toan', 'da_thanh_toan', 'that_bai') DEFAULT 'cho_duyet',
    phuong_thuc_thanh_toan ENUM('COD', 'BANK_TRANSFER', 'MOMO') DEFAULT 'COD',
    momo_order_id VARCHAR(50) NULL COMMENT 'Mã đơn hàng gửi sang MoMo',
    dia_chi_giao_hang TEXT NOT NULL,
    ghi_chu TEXT NULL,
    ngay_dat_hang TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Chi tiết đơn hàng
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    so_luong INT NOT NULL CHECK (so_luong > 0),
    gia_luc_mua DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng Đánh giá sản phẩm
CREATE TABLE product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    user_id INT,
    so_sao INT CHECK (so_sao BETWEEN 1 AND 5),
    binh_luan TEXT,
    ngay_danh_gia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Bảng Yêu thích (Wishlist)
CREATE TABLE wishlist (
    user_id INT,
    product_id INT,
    ngay_them TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Bảng Giỏ hàng
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    so_luong INT DEFAULT 1 CHECK (so_luong > 0),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng Cây của người dùng (Minigame trồng cây)
CREATE TABLE user_plants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_name VARCHAR(255) NOT NULL,
    last_watered_at DATETIME DEFAULT NULL,
    watering_interval_hours INT NOT NULL DEFAULT 24,
    xp INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_last_watered (last_watered_at, watering_interval_hours)
) ENGINE=InnoDB;

-- 12. Bảng Lượt quay Minigame
CREATE TABLE minigame_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    luot_quay INT DEFAULT 3 CHECK (luot_quay >= 0),
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng Sự kiện khuyến mãi
CREATE TABLE promotional_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    hinh_anh_url VARCHAR(255),
    coupon_id INT NULL,
    ngay_bat_dau DATETIME NULL,
    ngay_ket_thuc DATETIME NULL,
    dang_hien_thi BOOLEAN DEFAULT TRUE,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    INDEX idx_event_status (dang_hien_thi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng Giao dịch MoMo
CREATE TABLE momo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT 'Tham chiếu id của orders',
    request_id VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 0) NOT NULL,
    trans_id BIGINT NULL,
    result_code INT NULL,
    message VARCHAR(255) NULL,
    pay_type VARCHAR(50) NULL,
    response_time VARCHAR(50) NULL,
    extra_data TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ==========================================
-- CHÈN DỮ LIỆU MẪU
-- ==========================================

INSERT INTO categories (id, ten_danh_muc, mo_ta) VALUES 
(1, 'Cây Cảnh', 'Cây để bàn, trang trí nội thất'),
(2, 'Cây Giống', 'Cây giống ăn trái, rau màu');

INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, vai_tro) VALUES 
('admin', '123456', 'admin@treeshop.com', 'Quản trị viên', 'admin'),
('khach01', '123456', 'khach01@gmail.com', 'Nguyễn Văn Khách', 'khach_hang');

INSERT INTO products (category_id, ten_san_pham, gia_tien, so_luong_kho, hinh_anh_url, mo_ta) VALUES
(1, 'Cây Xương Rồng', 50000, 100, 'images/cactus.jpg', 'Chịu hạn cực tốt. Chi tiết: Tưới nước 1 lần/tuần.'),
(1, 'Cây Lưỡi Hổ', 120000, 50, 'images/SnakePlant.jpg', 'Thanh lọc không khí. Chi tiết: Ưa bóng râm.'),
(1, 'Cây Sen Đá', 80000, 80, 'images/Succulent.jpg', 'Tượng trưng cho tình yêu vĩnh cửu.'),
(1, 'Cây Bàng Đài Loan', 250000, 20, 'images/cay_bang_dai_loan.jpg', 'Tạo không gian xanh mát hiện đại.'),
(2, 'Giống Cây Cà Chua', 15000, 500, 'images/Cay_Ca_Chua.jpg', 'Khỏe mạnh, trái sai. Thu hoạch sau 70-80 ngày.'),
(2, 'Giống Ớt Chỉ Thiên', 12000, 300, 'images/Ot_Chi_Thien.jpg', 'Vị cay nồng, năng suất cao.'),
(2, 'Giống Hoa Hướng Dương', 25000, 150, 'images/Huong-Duong.jpg', 'Bông to rực rỡ. Nở hoa sau 60 ngày.'),
(2, 'Cây Giống Chanh Dây', 45000, 100, 'images/Chanh_Day.jpg', 'Leo khỏe, che mát sân thượng.'),
(2, 'Cây Giống Cam Sành', 65000, 60, 'images/CamSanh.jpg', 'Vị ngọt thanh, vỏ dày.'),
(2, 'Cây Giống Xoài Cát', 85000, 40, 'images/XoaiCat.jpg', 'Xoài Cát Hòa Lộc nổi tiếng.'),
(2, 'Cây Mít Thái', 70000, 45, 'images/MitThai.jpg', 'Trái quanh năm, múi dày giòn.'),
(2, 'Cây Chôm Chôm Thái', 90000, 30, 'images/ChomChomThai.jpg', 'Trái to, râu dài, cơm dày.'),
(2, 'Cây Nhãn Ido', 75000, 35, 'images/NhanIdo.jpg', 'Hạt nhỏ, cơm dày, độ đường cao.'),
(2, 'Sầu Riêng Ri6', 150000, 25, 'images/SauRiengRi6.jpg', 'Cơm vàng hạt lép, mùi thơm nồng.'),
(2, 'Cây Măng Cụt', 110000, 20, 'images/CayMangCut.jpg', 'Vị chua ngọt thanh khiết.'),
(2, 'Cây Vú Sữa Lò Rèn', 80000, 30, 'images/VuSuaLoRen.jpg', 'Đặc sản miền Tây.'),
(2, 'Cây Sơ Ri', 55000, 50, 'images/CaySoRi.jpg', 'Hàm lượng Vitamin C cực cao.'),
(2, 'Mãng Cầu Xiêm', 60000, 40, 'images/MangCauXiem.jpg', 'Trái to, vị chua ngọt giải nhiệt.'),
(2, 'Dừa Xiêm Lùn', 45000, 100, 'images/DuaXiemLun.jpg', 'Nước ngọt, cây thcartcartấp dễ hái.'),
(2, 'Bưởi Da Xanh', 95000, 30, 'images/BuoiDaXanh.jpg', 'Ruột hồng, tép bó, ngọt thanh.'),
(2, 'Cây Cà Na Thái', 50000, 50, 'images/CayCaNaThai.jpg', 'Chịu ngập nước tốt.'),
(2, 'Cây Hồng Quân', 65000, 15, 'images/CayHongQuan.jpg', 'Trái chín tím đỏ, gợi nhớ tuổi thơ.'),
(2, 'Dâu Xanh (Dâu Da)', 60000, 25, 'images/CayDauXanh.jpg', 'Trái mọc thành chùm từ thân.'),
(2, 'Cây Chanh Giấy', 35000, 120, 'images/CayChanhGiay.jpg', 'Vỏ mỏng, nhiều nước, rất thơm.');

-- Insert mẫu đơn hàng
INSERT INTO orders (user_id, dia_chi_giao_hang, trang_thai, phuong_thuc_thanh_toan) 
VALUES (2, '123 Đường ABC, Quận 1', 'cho_duyet', 'COD');