const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { verifyToken, isAdmin } = require('../../middlewares/authadmin');

// Áp dụng bảo vệ Token và quyền Admin cho TOÀN BỘ route /api/admin/*
router.use(verifyToken, isAdmin);

// =========================================================================
// 1. DASHBOARD STATS - Lấy số liệu thật 100% từ Database MySQL
// GET /api/admin/stats
// =========================================================================
router.get('/stats', async (req, res) => {
    try {
        // 1. Thống kê User
        const [[userStats]] = await pool.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN dang_hoat_dong = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN dang_hoat_dong = 0 THEN 1 ELSE 0 END) as locked_users,
                SUM(CASE WHEN DATE(ngay_tao) = CURDATE() THEN 1 ELSE 0 END) as new_users_today,
                SUM(CASE WHEN dang_hoat_dong = 1 AND last_seen IS NOT NULL AND last_seen >= DATE_SUB(NOW(), INTERVAL 2 MINUTE) THEN 1 ELSE 0 END) as online_users
            FROM users
        `);


        // 2. Thống kê Sản phẩm
        const [[prodStats]] = await pool.execute(`
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN dang_kinh_doanh = 1 THEN 1 ELSE 0 END) as active_products,
                SUM(CASE WHEN dang_kinh_doanh = 0 THEN 1 ELSE 0 END) as inactive_products,
                SUM(CASE WHEN so_luong_kho <= 5 AND so_luong_kho > 0 THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN so_luong_kho <= 0 THEN 1 ELSE 0 END) as out_of_stock
            FROM products
        `);

        // 3. Thống kê Danh mục
        const [[catStats]] = await pool.execute("SELECT COUNT(*) as total_categories FROM categories");

        // 4. Thống kê Đơn hàng & Doanh thu
        const [[orderStats]] = await pool.execute(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN trang_thai IN ('cho_duyet', 'cho_xu_ly', 'dang_xu_ly') THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN trang_thai = 'dang_xu_ly' THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN trang_thai = 'dang_giao' THEN 1 ELSE 0 END) as shipping_orders,
                SUM(CASE WHEN trang_thai IN ('da_giao', 'hoan_thanh') OR trang_thai LIKE 'da_thu%' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN trang_thai = 'da_huy' THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(CASE WHEN trang_thai NOT IN ('da_huy', 'cho_duyet', 'cho_xu_ly') THEN tong_thanh_toan ELSE 0 END) as total_revenue,
                SUM(CASE WHEN trang_thai NOT IN ('da_huy', 'cho_duyet', 'cho_xu_ly') AND DATE(ngay_dat_hang) = CURDATE() THEN tong_thanh_toan ELSE 0 END) as today_revenue,
                SUM(CASE WHEN trang_thai NOT IN ('da_huy', 'cho_duyet', 'cho_xu_ly') AND MONTH(ngay_dat_hang) = MONTH(CURDATE()) AND YEAR(ngay_dat_hang) = YEAR(CURDATE()) THEN tong_thanh_toan ELSE 0 END) as month_revenue
            FROM orders
        `);

        // 5. Thống kê Voucher (từ user_coupons & coupons)
        const [[voucherStats]] = await pool.execute(`
            SELECT 
                COUNT(*) as total_vouchers,
                SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_vouchers,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_vouchers
            FROM user_coupons
        `);

        // 6. Thống kê Event cây ảo
        const [[eventStats]] = await pool.execute("SELECT COUNT(*) as total_participants FROM event_progress");

        res.json({
            success: true,
            data: {
                users: {
                    total: Number(userStats.total_users || 0),
                    active: Number(userStats.active_users || 0),
                    locked: Number(userStats.locked_users || 0),
                    online: Number(userStats.online_users || 0),
                    offline: Number(userStats.total_users || 0) - Number(userStats.online_users || 0),
                    new_today: Number(userStats.new_users_today || 0)
                },

                products: {
                    total: Number(prodStats.total_products || 0),
                    active: Number(prodStats.active_products || 0),
                    inactive: Number(prodStats.inactive_products || 0),
                    low_stock: Number(prodStats.low_stock || 0),
                    out_of_stock: Number(prodStats.out_of_stock || 0),
                    categories: Number(catStats.total_categories || 0)
                },
                orders: {
                    total: Number(orderStats.total_orders || 0),
                    pending: Number(orderStats.pending_orders || 0),
                    processing: Number(orderStats.processing_orders || 0),
                    shipping: Number(orderStats.shipping_orders || 0),
                    completed: Number(orderStats.completed_orders || 0),
                    cancelled: Number(orderStats.cancelled_orders || 0)
                },
                revenue: {
                    total: Number(orderStats.total_revenue || 0),
                    today: Number(orderStats.today_revenue || 0),
                    month: Number(orderStats.month_revenue || 0)
                },
                vouchers: {
                    total: Number(voucherStats.total_vouchers || 0),
                    used: Number(voucherStats.used_vouchers || 0),
                    available: Number(voucherStats.available_vouchers || 0)
                },
                events: {
                    participants: Number(eventStats.total_participants || 0)
                }
            }
        });
    } catch (error) {
        console.error("Lỗi lấy Dashboard Stats:", error);
        res.status(500).json({ success: false, message: "Lỗi thống kê máy chủ", error: error.message });
    }
});

// =========================================================================
// 2. QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD)
// =========================================================================

// GET /api/admin/products — Xem danh sách có tìm kiếm, lọc danh mục/trạng thái, phân trang
router.get('/products', async (req, res) => {
    try {
        const { search, category_id, status, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offset = (pageNum - 1) * limitNum;

        let conditions = [];
        let params = [];

        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(p.ten_san_pham LIKE ? OR p.mo_ta LIKE ? OR p.id = ?)');
            params.push(term, term, parseInt(search.trim()) || 0);
        }

        if (category_id && category_id !== 'all') {
            conditions.push('p.category_id = ?');
            params.push(parseInt(category_id));
        }

        if (status && status !== 'all') {
            if (status === 'active' || status === '1') {
                conditions.push('p.dang_kinh_doanh = 1');
            } else if (status === 'inactive' || status === '0') {
                conditions.push('p.dang_kinh_doanh = 0');
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT p.id, p.category_id, p.ten_san_pham, p.ten_khoa_hoc, p.mo_ta, p.gia_tien,
                   p.so_luong_kho, p.hinh_anh_url, p.dang_kinh_doanh, p.ngay_tao, p.ngay_cap_nhat,
                   c.ten_danh_muc as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;

        const [products] = await pool.query(sql, [...params, limitNum, offset]);
        const [[{ total }]] = await pool.query(countSql, params);

        res.json({
            success: true,
            data: products,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách products:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách sản phẩm", error: error.message });
    }
});

// POST /api/admin/products — Thêm sản phẩm mới vào MySQL
router.post('/products', async (req, res) => {
    try {
        const { ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, mo_ta, ten_khoa_hoc, dang_kinh_doanh } = req.body;

        if (!ten_san_pham || ten_san_pham.trim() === '') {
            return res.status(400).json({ success: false, message: "Tên sản phẩm không được để trống!" });
        }

        const price = Math.max(0, parseFloat(gia_tien) || 0);
        const stock = Math.max(0, parseInt(so_luong_kho) || 0);
        const catId = category_id ? parseInt(category_id) : null;
        const active = dang_kinh_doanh === false || dang_kinh_doanh === 0 || dang_kinh_doanh === '0' ? 0 : 1;

        const sql = `
            INSERT INTO products (ten_san_pham, ten_khoa_hoc, mo_ta, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            ten_san_pham.trim(),
            ten_khoa_hoc ? ten_khoa_hoc.trim() : null,
            mo_ta ? mo_ta.trim() : null,
            price,
            stock,
            catId,
            hinh_anh_url ? hinh_anh_url.trim() : null,
            active
        ]);

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Thêm sản phẩm thành công vào Database!"
        });
    } catch (error) {
        console.error("Lỗi thêm sản phẩm:", error);
        res.status(500).json({ success: false, message: "Lỗi thêm sản phẩm: " + error.message });
    }
});

// PUT /api/admin/products/:id — Sửa sản phẩm trong MySQL
router.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, mo_ta, ten_khoa_hoc, dang_kinh_doanh } = req.body;

        if (!ten_san_pham || ten_san_pham.trim() === '') {
            return res.status(400).json({ success: false, message: "Tên sản phẩm không được để trống!" });
        }

        const price = Math.max(0, parseFloat(gia_tien) || 0);
        const stock = Math.max(0, parseInt(so_luong_kho) || 0);
        const catId = category_id ? parseInt(category_id) : null;
        const active = dang_kinh_doanh === false || dang_kinh_doanh === 0 || dang_kinh_doanh === '0' ? 0 : 1;

        const sql = `
            UPDATE products 
            SET ten_san_pham = ?, ten_khoa_hoc = ?, mo_ta = ?, gia_tien = ?, so_luong_kho = ?, 
                category_id = ?, hinh_anh_url = ?, dang_kinh_doanh = ?, ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await pool.execute(sql, [
            ten_san_pham.trim(),
            ten_khoa_hoc ? ten_khoa_hoc.trim() : null,
            mo_ta ? mo_ta.trim() : null,
            price,
            stock,
            catId,
            hinh_anh_url ? hinh_anh_url.trim() : null,
            active,
            id
        ]);

        res.json({ success: true, message: "Cập nhật sản phẩm thành công!" });
    } catch (error) {
        console.error("Lỗi sửa sản phẩm:", error);
        res.status(500).json({ success: false, message: "Lỗi sửa sản phẩm: " + error.message });
    }
});

// PUT /api/admin/products/:id/toggle-status — Ngưng bán / Kích hoạt bán sản phẩm (1 chạm)
router.put('/products/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE products SET dang_kinh_doanh = NOT dang_kinh_doanh WHERE id = ?', [id]);
        const [[updated]] = await pool.execute('SELECT dang_kinh_doanh FROM products WHERE id = ?', [id]);
        
        const isNowActive = updated ? Boolean(updated.dang_kinh_doanh) : false;
        res.json({
            success: true,
            dang_kinh_doanh: isNowActive ? 1 : 0,
            message: isNowActive ? "Đã kích hoạt bán sản phẩm!" : "Đã chuyển sản phẩm sang trạng thái Ngưng bán!"
        });
    } catch (error) {
        console.error("Lỗi toggle status product:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái bán: " + error.message });
    }
});

// DELETE /api/admin/products/:id — Xóa an toàn: Kiểm tra lịch sử đơn hàng
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // KIỂM TRA RÀNG BUỘC TOÀN VẸN: Sản phẩm đã từng có trong đơn hàng chưa?
        const [[{ orderCount }]] = await pool.execute(
            'SELECT COUNT(*) as orderCount FROM order_items WHERE product_id = ?', 
            [id]
        );

        if (orderCount > 0) {
            // ĐÃ CÓ ĐƠN HÀNG: Tuyệt đối KHÔNG xóa cứng để giữ nguyên hóa đơn khách hàng
            await pool.execute('UPDATE products SET dang_kinh_doanh = 0 WHERE id = ?', [id]);
            return res.json({
                success: true,
                softDeleted: true,
                message: `Sản phẩm này đã có trong ${orderCount} đơn hàng. Để bảo toàn lịch sử giao dịch, hệ thống đã chuyển sản phẩm sang trạng thái "Ngưng bán" thay vì xóa vĩnh viễn.`
            });
        }

        // Chưa từng có đơn hàng: Cho phép DELETE cứng
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, softDeleted: false, message: "Đã xóa vĩnh viễn sản phẩm thành công!" });
    } catch (error) {
        console.error("Lỗi xóa product:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm: " + error.message });
    }
});

// =========================================================================
// 3. QUẢN LÝ DANH MỤC (CATEGORIES CRUD)
// =========================================================================

// GET /api/admin/categories — Lấy danh mục kèm số lượng sản phẩm
router.get('/categories', async (req, res) => {
    try {
        const sql = `
            SELECT c.id, c.ten_danh_muc, c.mo_ta, c.ngay_tao,
                   COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.ten_danh_muc, c.mo_ta, c.ngay_tao
            ORDER BY c.id ASC
        `;
        const [rows] = await pool.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Lỗi lấy categories:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh mục", error: error.message });
    }
});

// POST /api/admin/categories — Tạo danh mục mới
router.post('/categories', async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        if (!ten_danh_muc || ten_danh_muc.trim() === '') {
            return res.status(400).json({ success: false, message: "Tên danh mục không được để trống!" });
        }

        const [result] = await pool.execute(
            'INSERT INTO categories (ten_danh_muc, mo_ta) VALUES (?, ?)',
            [ten_danh_muc.trim(), mo_ta ? mo_ta.trim() : null]
        );

        res.status(201).json({ success: true, id: result.insertId, message: "Thêm danh mục thành công!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Tên danh mục này đã tồn tại!" });
        }
        res.status(500).json({ success: false, message: "Lỗi thêm danh mục: " + error.message });
    }
});

// PUT /api/admin/categories/:id — Cập nhật danh mục
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_danh_muc, mo_ta } = req.body;

        if (!ten_danh_muc || ten_danh_muc.trim() === '') {
            return res.status(400).json({ success: false, message: "Tên danh mục không được để trống!" });
        }

        await pool.execute(
            'UPDATE categories SET ten_danh_muc = ?, mo_ta = ? WHERE id = ?',
            [ten_danh_muc.trim(), mo_ta ? mo_ta.trim() : null, id]
        );

        res.json({ success: true, message: "Cập nhật danh mục thành công!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Tên danh mục này đã bị trùng!" });
        }
        res.status(500).json({ success: false, message: "Lỗi cập nhật danh mục: " + error.message });
    }
});

// DELETE /api/admin/categories/:id — Kiểm tra chặn xóa nếu danh mục đang có sản phẩm
router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // KIỂM TRA: Danh mục có sản phẩm không?
        const [[{ prodCount }]] = await pool.execute(
            'SELECT COUNT(*) as prodCount FROM products WHERE category_id = ?',
            [id]
        );

        if (prodCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục này vì đang có ${prodCount} sản phẩm thuộc danh mục! Vui lòng chuyển các sản phẩm sang danh mục khác trước.`
            });
        }

        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: "Đã xóa danh mục thành công!" });
    } catch (error) {
        console.error("Lỗi xóa category:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa danh mục: " + error.message });
    }
});

// =========================================================================
// 4. QUẢN LÝ NGƯỜI DÙNG (USERS - KHÔNG LỘ PASSWORD)
// =========================================================================

// GET /api/admin/users — Tuyệt đối không chọn mat_khau
router.get('/users', async (req, res) => {
    try {
        const { search, vai_tro, status, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offset = (pageNum - 1) * limitNum;

        let conditions = [];
        let params = [];

        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(ho_ten LIKE ? OR email LIKE ? OR ten_dang_nhap LIKE ? OR so_dien_thoai LIKE ?)');
            params.push(term, term, term, term);
        }

        if (vai_tro && vai_tro !== 'all') {
            conditions.push('vai_tro = ?');
            params.push(vai_tro);
        }

        if (status && status !== 'all') {
            if (status === 'active' || status === '1') {
                conditions.push('dang_hoat_dong = 1');
            } else if (status === 'inactive' || status === '0') {
                conditions.push('dang_hoat_dong = 0');
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // CHỈ LẤY CÁC TRƯỜNG AN TOÀN — KHÔNG LẤY mat_khau
        const sql = `
            SELECT id, ten_dang_nhap, email, ho_ten, dia_chi, so_dien_thoai, vai_tro, dang_hoat_dong, ngay_tao, avatar, last_seen,
                   CASE 
                       WHEN dang_hoat_dong = 1 AND last_seen IS NOT NULL AND last_seen >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)
                       THEN 1 ELSE 0
                   END as online
            FROM users
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;

        const [users] = await pool.query(sql, [...params, limitNum, offset]);
        const [[{ total }]] = await pool.query(countSql, params);

        // Chuyển đổi kiểu dữ liệu: online = boolean
        const usersResult = users.map((u) => ({
            ...u,
            online: Boolean(u.online),
            dang_hoat_dong: u.dang_hoat_dong ? 1 : 0
        }));

        res.json({
            success: true,
            data: usersResult,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });

    } catch (error) {
        console.error("Lỗi lấy users:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách người dùng", error: error.message });
    }
});

// PUT /api/admin/users/:id/toggle-status — Khóa / Mở khóa tài khoản
router.put('/users/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        if (id == 1) {
            return res.status(400).json({ success: false, message: "Không thể khóa tài khoản Quản trị viên gốc!" });
        }

        await pool.execute('UPDATE users SET dang_hoat_dong = NOT dang_hoat_dong WHERE id = ?', [id]);
        const [[u]] = await pool.execute('SELECT dang_hoat_dong FROM users WHERE id = ?', [id]);

        const active = Boolean(u?.dang_hoat_dong);
        res.json({
            success: true,
            dang_hoat_dong: active ? 1 : 0,
            message: active ? "Đã mở khóa tài khoản thành công!" : "Đã khóa tài khoản người dùng!"
        });
    } catch (error) {
        console.error("Lỗi toggle status user:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái người dùng" });
    }
});

// PUT /api/admin/users/:id — Cập nhật thông tin người dùng (không nhạy cảm)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ho_ten, email, so_dien_thoai, dia_chi, vai_tro } = req.body;

        await pool.execute(
            'UPDATE users SET ho_ten = ?, email = ?, so_dien_thoai = ?, dia_chi = ?, vai_tro = ? WHERE id = ?',
            [
                ho_ten ? ho_ten.trim() : null,
                email ? email.trim() : null,
                so_dien_thoai ? so_dien_thoai.trim() : null,
                dia_chi ? dia_chi.trim() : null,
                vai_tro || 'khach_hang',
                id
            ]
        );

        res.json({ success: true, message: "Cập nhật thông tin người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật user:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật người dùng: " + error.message });
    }
});

// POST /api/admin/users/create — Tạo tài khoản người dùng mới
router.post('/users/create', async (req, res) => {
    const bcrypt = require('bcryptjs');
    try {
        const { ten_dang_nhap, mat_khau, email, ho_ten, so_dien_thoai, dia_chi, vai_tro } = req.body;

        if (!ten_dang_nhap || !ten_dang_nhap.trim()) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập không được để trống!" });
        }
        if (!mat_khau || mat_khau.trim().length < 6) {
            return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự!" });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: "Email không được để trống!" });
        }

        const hashedPassword = await bcrypt.hash(mat_khau.trim(), 10);
        const role = (vai_tro === 'admin') ? 'admin' : 'khach_hang';

        const [result] = await pool.execute(
            'INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, so_dien_thoai, dia_chi, vai_tro, dang_hoat_dong) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
            [
                ten_dang_nhap.trim(),
                hashedPassword,
                email.trim(),
                ho_ten ? ho_ten.trim() : null,
                so_dien_thoai ? so_dien_thoai.trim() : null,
                dia_chi ? dia_chi.trim() : null,
                role
            ]
        );

        res.status(201).json({ success: true, id: result.insertId, message: "Tạo tài khoản người dùng thành công!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc Email đã tồn tại!" });
        }
        console.error("Lỗi tạo user:", error);
        res.status(500).json({ success: false, message: "Lỗi tạo người dùng: " + error.message });
    }
});

// DELETE /api/admin/users/:id — Xóa tài khoản người dùng (bảo vệ Admin gốc id=1)
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (id == 1) {
            return res.status(400).json({ success: false, message: "Không thể xóa tài khoản Quản trị viên gốc!" });
        }

        const [[u]] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
        if (!u) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại!" });
        }

        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: "Đã xóa tài khoản người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi xóa user:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa người dùng: " + error.message });
    }
});

// =========================================================================
// 5. QUẢN LÝ ĐƠN HÀNG (ORDERS)
// =========================================================================

// GET /api/admin/orders — Xem danh sách đơn hàng
router.get('/orders', async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offset = (pageNum - 1) * limitNum;

        let conditions = [];
        let params = [];

        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(o.id = ? OR u.ho_ten LIKE ? OR u.so_dien_thoai LIKE ?)');
            params.push(parseInt(search.trim()) || 0, term, term);
        }

        if (status && status !== 'all') {
            conditions.push('o.trang_thai = ?');
            params.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT o.id, o.user_id, o.coupon_id, o.tong_tien_hang, o.so_tien_giam_gia,
                   o.tong_thanh_toan, o.trang_thai, o.dia_chi_giao_hang, o.ngay_dat_hang, o.ma_giam_gia,
                   u.ho_ten, u.so_dien_thoai, u.email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ${whereClause}
            ORDER BY o.id DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as total 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ${whereClause}
        `;

        const [orders] = await pool.query(sql, [...params, limitNum, offset]);
        const [[{ total }]] = await pool.query(countSql, params);

        res.json({
            success: true,
            data: orders,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách orders:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" });
    }
});

// GET /api/admin/orders/:id — Xem chi tiết đơn hàng (kèm sản phẩm từ order_items)
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [[order]] = await pool.execute(`
            SELECT o.*, u.ho_ten as user_name, u.so_dien_thoai as user_phone, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [id]);

        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }

        const [items] = await pool.execute(`
            SELECT oi.id, oi.product_id, oi.so_luong, oi.gia_luc_mua,
                   p.ten_san_pham, p.hinh_anh_url
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        res.json({
            success: true,
            data: {
                ...order,
                items
            }
        });
    } catch (error) {
        console.error("Lỗi lấy chi tiết đơn hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy chi tiết đơn hàng" });
    }
});

// =========================================================================
// QUY TẮC CHUYỂN TRẠNG THÁI MỘT CHIỀU (ONE-WAY ORDER TRANSITION)
// =========================================================================
function normalizeOrderStatus(st) {
    if (!st) return '';
    const s = String(st).toLowerCase().trim();
    if (['cho_duyet', 'cho_xu_ly', 'dang_xu_ly'].includes(s)) return 'cho_xu_ly';
    if (s === 'dang_giao') return 'dang_giao';
    if (['hoan_thanh', 'da_giao'].includes(s) || s.startsWith('da_thu')) return 'hoan_thanh';
    if (s === 'da_huy') return 'da_huy';
    return s;
}

const ORDER_STATUS_LABELS = {
    cho_xu_ly: "Chờ xử lý",
    dang_giao: "Đang giao",
    hoan_thanh: "Hoàn thành",
    da_huy: "Đã hủy"
};

const ALLOWED_ORDER_TRANSITIONS = {
    cho_xu_ly: ['dang_giao', 'da_huy'],
    dang_giao: ['hoan_thanh'],
    hoan_thanh: [], // Trạng thái cuối: không được chuyển nữa
    da_huy: []       // Trạng thái cuối: không được chuyển nữa
};

// PUT /api/admin/orders/:id/status — Cập nhật trạng thái đơn hàng (Bắt buộc kiểm tra quy tắc một chiều)
router.put('/orders/:id/status', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const rawStatus = req.body.status || req.body.trang_thai;

        if (!rawStatus) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp trạng thái mới ('trang_thai' hoặc 'status')!" });
        }

        // 1. Kiểm tra đơn hàng tồn tại
        const [[order]] = await conn.execute('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
        if (!order) {
            return res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng #${id}!` });
        }

        const currentNorm = normalizeOrderStatus(order.trang_thai);
        const targetNorm = normalizeOrderStatus(rawStatus);

        // 2. Kiểm tra nếu cùng trạng thái
        if (currentNorm === targetNorm) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng đã ở trạng thái '${ORDER_STATUS_LABELS[currentNorm] || order.trang_thai}'.`
            });
        }

        // 3. Kiểm tra transition một chiều
        const allowedTargets = ALLOWED_ORDER_TRANSITIONS[currentNorm] || [];
        if (!allowedTargets.includes(targetNorm)) {
            const currentLabel = ORDER_STATUS_LABELS[currentNorm] || order.trang_thai;
            const targetLabel = ORDER_STATUS_LABELS[targetNorm] || rawStatus;

            return res.status(400).json({
                success: false,
                message: `Không thể chuyển đơn hàng từ '${currentLabel}' sang '${targetLabel}'. Trạng thái đơn hàng chỉ được chuyển theo một chiều.`
            });
        }

        await conn.beginTransaction();

        // 4. Lưu trạng thái mới vào orders
        // Map targetNorm về giá trị lưu chuẩn
        const saveStatus = (targetNorm === 'hoan_thanh') ? 'hoan_thanh' : targetNorm;
        await conn.execute('UPDATE orders SET trang_thai = ? WHERE id = ?', [saveStatus, id]);

        // 5. Ghi nhận lịch sử chuyển trạng thái
        await conn.execute(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, ghi_chu)
             VALUES (?, ?, ?, ?, ?)`,
            [id, order.trang_thai, saveStatus, req.user?.id || null, req.body.ghi_chu || 'Admin chuyển trạng thái']
        );

        // 6. Xử lý khi HỦY ĐƠN (da_huy): Hoàn lại tồn kho sản phẩm và hoàn voucher
        if (targetNorm === 'da_huy') {
            // A. Hoàn trả số lượng kho cho từng sản phẩm trong đơn
            const [orderItems] = await conn.execute(
                'SELECT product_id, so_luong FROM order_items WHERE order_id = ?',
                [id]
            );
            for (const item of orderItems) {
                await conn.execute(
                    'UPDATE products SET so_luong_kho = so_luong_kho + ? WHERE id = ?',
                    [item.so_luong, item.product_id]
                );
            }

            // B. Hoàn trả voucher cá nhân đã dùng (nếu có)
            await conn.execute(
                `UPDATE user_coupons
                 SET status = 'available', used_at = NULL, used_order_id = NULL
                 WHERE used_order_id = ?`,
                [String(id)]
            );
            if (order.coupon_id) {
                await conn.execute(
                    `UPDATE user_coupons
                     SET status = 'available', used_at = NULL, used_order_id = NULL
                     WHERE id = ?`,
                    [order.coupon_id]
                );
            }
        }

        await conn.commit();

        // 7. Lấy lại thông tin đơn hàng sau cập nhật
        const [[updatedOrder]] = await pool.execute(`
            SELECT o.*, u.ho_ten, u.so_dien_thoai, u.email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [id]);

        res.json({
            success: true,
            message: `Đã chuyển trạng thái đơn hàng sang '${ORDER_STATUS_LABELS[targetNorm]}'`,
            data: updatedOrder
        });
    } catch (error) {
        await conn.rollback();
        console.error("Lỗi cập nhật trạng thái đơn:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái đơn hàng: " + error.message });
    } finally {
        conn.release();
    }
});

// PUT /api/admin/orders/:id/info — Cập nhật thông tin giao hàng
router.put('/orders/:id/info', async (req, res) => {
    try {
        const { id } = req.params;
        const { dia_chi_giao_hang } = req.body;
        await pool.execute('UPDATE orders SET dia_chi_giao_hang = ? WHERE id = ?', [dia_chi_giao_hang, id]);
        res.json({ success: true, message: "Cập nhật địa chỉ giao hàng thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật thông tin đơn hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật thông tin đơn hàng" });
    }
});

// DELETE /api/admin/orders/:id — Cấm xóa cứng đơn hàng để bảo toàn lịch sử theo quy định
router.delete('/orders/:id', async (req, res) => {
    return res.status(403).json({
        success: false,
        message: "Không được xóa đơn hàng đã phát sinh. Đơn hàng phải được lưu giữ toàn vẹn trong lịch sử hệ thống."
    });
});

// =========================================================================
// 6. QUẢN LÝ VOUCHER (COUPONS & USER_COUPONS)
// =========================================================================

// GET /api/admin/vouchers — Xem danh sách mã giảm giá
router.get('/vouchers', async (req, res) => {
    try {
        // Lấy danh sách coupons chung
        const [generalCoupons] = await pool.execute('SELECT * FROM coupons ORDER BY id DESC');
        
        // Lấy danh sách voucher cá nhân từ cây ảo
        const [userCoupons] = await pool.execute(`
            SELECT uc.*, u.ho_ten, u.email
            FROM user_coupons uc
            LEFT JOIN users u ON uc.user_id = u.id
            ORDER BY uc.id DESC
            LIMIT 50
        `);

        res.json({
            success: true,
            data: {
                general: generalCoupons,
                user_coupons: userCoupons
            }
        });
    } catch (error) {
        console.error("Lỗi lấy vouchers:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách voucher" });
    }
});

// POST /api/admin/vouchers — Tạo mã giảm giá mới (đảm bảo UNIQUE code)
router.post('/vouchers', async (req, res) => {
    try {
        const { ma_code, loai_giam_gia, gia_tri_giam } = req.body;

        if (!ma_code || ma_code.trim() === '') {
            return res.status(400).json({ success: false, message: "Mã code không được để trống!" });
        }

        const discountType = loai_giam_gia === 'so_tien_co_dinh' ? 'so_tien_co_dinh' : 'phan_tram';
        const discountVal = parseFloat(gia_tri_giam) || 0;

        const [result] = await pool.execute(
            'INSERT INTO coupons (ma_code, loai_giam_gia, gia_tri_giam, dang_ap_dung) VALUES (?, ?, ?, 1)',
            [ma_code.trim().toUpperCase(), discountType, discountVal]
        );

        res.status(201).json({ success: true, id: result.insertId, message: "Tạo voucher mới thành công!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Mã giảm giá này đã tồn tại trong hệ thống!" });
        }
        res.status(500).json({ success: false, message: "Lỗi tạo voucher: " + error.message });
    }
});

// =========================================================================
// 7. THỐNG KÊ EVENT CÂY ẢO
// =========================================================================

// GET /api/admin/events/stats — Thống kê minigame
router.get('/events/stats', async (req, res) => {
    try {
        const [[{ total_participants }]] = await pool.execute("SELECT COUNT(*) as total_participants FROM event_progress");
        const [stages] = await pool.execute("SELECT stage, COUNT(*) as count FROM event_progress GROUP BY stage ORDER BY stage ASC");
        
        const [[{ total_vouchers_issued }]] = await pool.execute("SELECT COUNT(*) as total_vouchers_issued FROM user_coupons WHERE code LIKE 'PLANT%'");
        const [[{ available_vouchers }]] = await pool.execute("SELECT COUNT(*) as available_vouchers FROM user_coupons WHERE code LIKE 'PLANT%' AND status = 'available'");
        const [[{ used_vouchers }]] = await pool.execute("SELECT COUNT(*) as used_vouchers FROM user_coupons WHERE code LIKE 'PLANT%' AND status = 'used'");

        const [vouchers_per_stage] = await pool.execute(`
            SELECT source_stage, COUNT(*) as count 
            FROM user_coupons 
            WHERE code LIKE 'PLANT%' AND source_stage IS NOT NULL 
            GROUP BY source_stage 
            ORDER BY source_stage ASC
        `);

        res.json({
            success: true,
            data: {
                total_participants: total_participants || 0,
                stages_distribution: stages,
                vouchers: {
                    total: total_vouchers_issued || 0,
                    available: available_vouchers || 0,
                    used: used_vouchers || 0,
                    per_stage: vouchers_per_stage
                }
            }
        });
    } catch (error) {
        console.error("Lỗi lấy thống kê event:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy thống kê sự kiện" });
    }
});


// =========================================================================
// 8. THONG KE NHIEM VU HANG NGAY (DAILY QUESTS)
// =========================================================================

// GET /api/admin/quests/stats - Thong ke nhiem vu
router.get('/quests/stats', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT missions, last_daily_reset_date, last_seed_claim_date FROM event_progress");
        
        const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
        const [month, day, year] = today.split('/');
        const todayStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        let loginCompleted = 0;
        let viewProductCompleted = 0;
        let seedClaimed = 0;
        
        rows.forEach(row => {
            if (row.last_seed_claim_date) {
                let claimDateStr = '';
                if (row.last_seed_claim_date instanceof Date) {
                    const parts = new Intl.DateTimeFormat('en-CA', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }).formatToParts(row.last_seed_claim_date);
                    const map = {};
                    parts.forEach(p => { map[p.type] = p.value; });
                    claimDateStr = `${map.year}-${map.month}-${map.day}`;
                } else {
                    claimDateStr = String(row.last_seed_claim_date).split('T')[0];
                }

                if (claimDateStr === todayStr) {
                    seedClaimed++;
                }
            }
            
            if (row.missions) {
                let missionsObj = {};
                if (typeof row.missions === 'string') {
                    try { missionsObj = JSON.parse(row.missions); } catch(e) {}
                } else {
                    missionsObj = row.missions;
                }
                
                if (missionsObj.login) loginCompleted++;
                if (missionsObj.view_product) viewProductCompleted++;
            }
        });

        res.json({
            success: true,
            data: {
                date: todayStr,
                quests: {
                    login_completed: loginCompleted,
                    view_product_completed: viewProductCompleted,
                    daily_seed_claimed: seedClaimed
                }
            }
        });
    } catch (error) {
        console.error("Loi lay thong ke quests:", error);
        res.status(500).json({ success: false, message: "Loi lay thong ke nhiem vu: " + error.message });
    }
});

module.exports = router;
