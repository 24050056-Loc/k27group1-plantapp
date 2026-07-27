-- 1. Khởi tạo Cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS tree_shop_db;
USE tree_shop_db;

-- Xóa các bảng cũ để làm mới cấu trúc (Theo thứ tự tránh lỗi khóa ngoại)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS cart, wishlist, product_reviews, order_items, orders, coupons, users, products, categories;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Bảng Danh mục
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
    mo_ta TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Sản phẩm
CREATE TABLE product (
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

-- 6. Bảng Đơn hàng
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    coupon_id INT,
    tong_tien_hang DECIMAL(10, 2) NOT NULL DEFAULT 0,
    so_tien_giam_gia DECIMAL(10, 2) DEFAULT 0,
    tong_thanh_toan DECIMAL(10, 2) AS (tong_tien_hang - so_tien_giam_gia) STORED,
    trang_thai ENUM('cho_duyet', 'dang_xu_ly', 'dang_giao', 'da_giao', 'da_huy', 'da_thu/da_xu_ly', 'da_thu/da_xac_nhan') DEFAULT 'cho_duyet',
    dia_chi_giao_hang TEXT NOT NULL,
    ngay_dat_hang TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- 9. Bảng Giỏ hàng & Yêu thích
CREATE TABLE wishlist (
    user_id INT,
    product_id INT,
    ngay_them TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    so_luong INT DEFAULT 1 CHECK (so_luong > 0),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng NGUỜI DÙNG (Cần thiết để liên kết user_id)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Bảng CÂY CỦA NGUỜI DÙNG (Lưu thông tin cây, thời gian tưới)
CREATE TABLE IF NOT EXISTS user_plants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_name VARCHAR(255) NOT NULL,
    last_watered_at DATETIME DEFAULT NULL,
    watering_interval_hours INT NOT NULL DEFAULT 24, -- Thời gian giữa các lần tưới (tính theo giờ)
    xp INT DEFAULT 0,                                -- Điểm kinh nghiệm (sử dụng trong event)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Khóa ngoại liên kết tới bảng users
    CONSTRAINT fk_user_plants_users 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
    -- Index giúp Cronjob truy vấn nhanh hơn khi dữ liệu lớn
    INDEX idx_last_watered (last_watered_at, watering_interval_hours)
) ENGINE=InnoDB;

-- 4. Bảng SỰ KIỆN KHUYẾN MÃI (Sử dụng cho sự kiện tặng voucher)
CREATE TABLE IF NOT EXISTS promotional_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dang_hien_thi BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index tối ưu truy vấn tìm sự kiện theo tên và trạng thái
    INDEX idx_event_status (dang_hien_thi, name)
) ENGINE=InnoDB;

-- Đổi từ `order` thành `orders` ở dòng đầu tiên này bạn nhé:
CREATE TABLE IF NOT EXISTS `order` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Mã đơn hàng (khớp với orderId gửi sang MoMo/Bank)',
    `user_id` INT NOT NULL COMMENT 'ID của người dùng mua hàng',
    `total_amount` DECIMAL(12, 0) NOT NULL COMMENT 'Tổng số tiền đơn hàng (VND không cần số thập phân)',
    `order_info` TEXT NULL COMMENT 'Mô tả hoặc thông tin chi tiết đơn hàng',
    `status` ENUM('Chờ thanh toán', 'Đã thanh toán', 'Thất bại', 'Đã hủy') DEFAULT 'Chờ thanh toán' COMMENT 'Trạng thái đơn hàng',
    `payment_method` ENUM('COD', 'BANK_TRANSFER', 'MOMO') NOT NULL COMMENT 'Phương thức thanh toán',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;
--  Bảng Lịch sử Giao dịch MoMo (momo_transactions)
-- Lưu lại lịch sử chi tiết từ Webhook/IPN của MoMo gửi về để đối soát khi cần
CREATE TABLE IF NOT EXISTS `momo` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(50) NOT NULL COMMENT 'Mã đơn hàng trong hệ thống của mình',
    `request_id` VARCHAR(100) NOT NULL COMMENT 'Mã yêu cầu duy nhất của mỗi lượt bấm thanh toán',
    `amount` DECIMAL(12, 0) NOT NULL COMMENT 'Số tiền MoMo ghi nhận thanh toán',
    `trans_id` BIGINT NULL COMMENT 'Mã giao dịch duy nhất do hệ thống MoMo sinh ra',
    `result_code` INT NULL COMMENT 'Mã kết quả (0: Thành công, khác 0: Thất bại/Hủy)',
    `message` VARCHAR(255) NULL COMMENT 'Thông báo trạng thái từ MoMo (Giao dịch thành công, Canceled...)',
    `pay_type` VARCHAR(50) NULL COMMENT 'Hình thức thanh toán (ví dụ: qr, web, app)',
    `response_time` VARCHAR(50) NULL COMMENT 'Thời gian MoMo xử lý xong giao dịch',
    `extra_data` TEXT NULL COMMENT 'Dữ liệu bổ sung nếu có gửi kèm',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Khóa ngoại liên kết tới bảng orders, nếu xóa đơn hàng thì xóa luôn log giao dịch liên quan
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS minigame_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE, -- Mỗi user chỉ có 1 dòng lưu lượt chơi
    luot_quay INT DEFAULT 3 CHECK (luot_quay >= 0), -- Mặc định tặng 3 lượt khi tạo mới
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS promotional_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    hinh_anh_url VARCHAR(255),
    coupon_id INT NULL,
    ngay_bat_dau DATETIME NULL,
    ngay_ket_thuc DATETIME NULL,
    dang_hien_thi BOOLEAN DEFAULT TRUE,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- CHÈN DỮ LIỆU (CATEGORIES, USERS & 24 PRODUCTS)
-- ==========================================

INSERT INTO categories (id, ten_danh_muc, mo_ta) VALUES 
(1, 'Cây Cảnh', 'Cây để bàn, trang trí nội thất'),
(2, 'Cây Giống', 'Cây giống ăn trái, rau màu');

INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, vai_tro) VALUES 
('admin', '123456', 'admin@treeshop.com', 'Quản trị viên', 'admin'),
('khach01', '123456', 'khach01@gmail.com', 'Nguyễn Văn Khách', 'khach_hang');

INSERT INTO product (category_id, ten_san_pham, gia_tien, so_luong_kho, hinh_anh_url, mo_ta) VALUES
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

-- Thay vì set user có id = 3 làm admin (vì chưa tồn tại user này), ta set user id = 1 hoặc id = 2, hoặc không cần set nữa vì user id = 1 đã là admin
-- update users set vai_tro = "admin" where id = 3;

-- Thay id = 3 bằng id = 2 (id của khach01) để đơn hàng có thể tạo thành công mà không bị lỗi foreign key
INSERT INTO orders (user_id, dia_chi_giao_hang, trang_thai, ngay_dat_hang) 
VALUES (2, '123 Đường ABC, Quận 1', 'cho_duyet', NOW());