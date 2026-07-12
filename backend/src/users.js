const express = require('express');
const router = express.Router();
const pool = require('./db.js');
const usersController = require('./Controller/usersController');
const authenticateToken = require('./middlewares/authMiddleware');

// ==========================================
// 1. API XÁC THỰC (AUTH)
// ==========================================
router.post('/register', usersController.register);
router.post('/login', usersController.login);

// ==========================================
// 2. API DÀNH CHO ADMIN (QUẢN LÝ TẤT CẢ USER)
// ==========================================

// Lấy danh sách toàn bộ người dùng (Để đổ vào bảng admin)
router.get('/', async (req, res) => {
    try {
        const sql = `SELECT id, ten_dang_nhap, email, ho_ten, so_dien_thoai, vai_tro, dang_hoat_dong, ngay_tao FROM users ORDER BY ngay_tao DESC`;
        const [rows] = await pool.execute(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách user", error: error.message });
    }
});

// Khóa/Mở khóa tài khoản
router.put('/toggle-status/:id', async (req, res) => {
    try {
        const sql = `UPDATE users SET dang_hoat_dong = NOT dang_hoat_dong WHERE id = ?`;
        await pool.execute(sql, [req.params.id]);
        res.json({ success: true, message: "Cập nhật trạng thái thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
    }
});

// Xóa người dùng
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa", error: error.message });
    }
});

// ==========================================
// 3. API NGƯỜI DÙNG (PROFILE & LỊCH SỬ)
// ==========================================

// Lấy thông tin cá nhân của 1 người dùng cụ thể
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const sql = `
            SELECT id, ten_dang_nhap, email, ho_ten, dia_chi, so_dien_thoai, vai_tro, ngay_tao 
            FROM users 
            WHERE id = ? AND dang_hoat_dong = TRUE
        `;
        const [rows] = await pool.execute(sql, [userId]);
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cập nhật thông tin cá nhân
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, phone, address } = req.body;

        const sql = `
            UPDATE users 
            SET ho_ten = COALESCE(?, ho_ten),
                so_dien_thoai = COALESCE(?, so_dien_thoai),
                dia_chi = COALESCE(?, dia_chi)
            WHERE id = ?
        `;
        await pool.execute(sql, [name || null, phone || null, address || null, userId]);
        res.json({ success: true, message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
    }
});

// Lấy lịch sử đơn hàng của người dùng
router.get('/:id/orders', async (req, res) => {
    try {
        const userId = req.params.id;
        const sql = `
            SELECT id, tong_thanh_toan, trang_thai, ngay_dat_hang, dia_chi_giao_hang 
            FROM orders 
            WHERE user_id = ? 
            ORDER BY ngay_dat_hang DESC
        `;
        const [rows] = await pool.execute(sql, [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cập nhật trạng thái thanh toán và thông tin giao hàng
router.put('/:userId/orders/:orderId/pay', authenticateToken, async (req, res) => {
    try {
        const { userId, orderId } = req.params;
        const { phuong_thuc_thanh_toan, ho_ten, so_dien_thoai, dia_chi_giao_hang } = req.body;

        const paymentStatus = phuong_thuc_thanh_toan === 'bank_transfer' ? 'dang_xu_ly' : 'da_thu/da_xu_ly';
        const finalPayment = phuong_thuc_thanh_toan === 'bank_transfer' ? 'bank_transfer' : 'cod';
        const updateOrder = `
            UPDATE orders 
            SET trang_thai = ?,
                phuong_thuc_thanh_toan = ?,
                dia_chi_giao_hang = COALESCE(?, dia_chi_giao_hang)
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await pool.execute(updateOrder, [paymentStatus, finalPayment, dia_chi_giao_hang || null, orderId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại hoặc không thuộc người dùng này.' });
        }

        if (ho_ten || so_dien_thoai) {
             const updateUser = `
                UPDATE users 
                SET ho_ten = COALESCE(?, ho_ten),
                    so_dien_thoai = COALESCE(?, so_dien_thoai)
                WHERE id = ?
             `;
             await pool.execute(updateUser, [ho_ten || null, so_dien_thoai || null, userId]);
        }

        res.json({ success: true, message: 'Xác nhận thanh toán thành công' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

modules.exports = router;