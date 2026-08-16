const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const authenticateToken = require('../middlewares/authMiddleware.js');

// 1. Lấy danh sách giỏ hàng
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT c.id as cart_id, c.so_luong, p.id as product_id, p.ten_san_pham, p.gia_tien, p.hinh_anh_url, p.so_luong_kho
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `;
        const [cartItems] = await pool.execute(query, [userId]);
        res.json({ success: true, data: cartItems });
    } catch (error) {
        console.error("GET CART ERROR:", error); // Log lỗi ở server để tiện debug
        res.status(500).json({ success: false, message: "Lỗi server khi tải giỏ hàng" });
    }
});

// 2. Thêm vào giỏ hàng
// 2. Thêm vào giỏ hàng (Đã tối ưu)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy dữ liệu (ưu tiên product_id, nếu không có thì lấy san_pham_id)
        let product_id = req.body.product_id || req.body.san_pham_id;
        let so_luong = req.body.so_luong || req.body.quantity;

        // 1. Validation cơ bản
        product_id = parseInt(product_id, 10);
        so_luong = parseInt(so_luong, 10);

        if (!product_id || isNaN(product_id) || isNaN(so_luong) || so_luong <= 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ! Số lượng phải lớn hơn 0." });
        }
        // 2. Kiểm tra tồn kho & Số lượng hiện có trong giỏ hàng (Chỉ dùng 1 Query JOIN)
        const [rows] = await pool.execute(
            `SELECT p.id, p.so_luong_kho, p.ten_san_pham, COALESCE(c.so_luong, 0) AS so_luong_hien_co
             FROM products p
             LEFT JOIN cart c ON p.id = c.product_id AND c.user_id = ?
             WHERE p.id = ?`,
            [userId, product_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại!" });
        }

        const product = rows[0];
        const tong_so_luong_du_kien = product.so_luong_hien_co + so_luong;

        // 3. Kiểm tra hạn mức kho
        if (tong_so_luong_du_kien > product.so_luong_kho) {
            return res.status(400).json({
                success: false,
                message: `Không thể thêm! Trong kho chỉ còn ${product.so_luong_kho} sản phẩm, giỏ hàng của bạn đang có ${product.so_luong_hien_co} sản phẩm.`
            });
        }

        // 4. Thêm mới hoặc Cập nhật cộng dồn bằng ON DUPLICATE KEY UPDATE (Yêu cầu phải có UNIQUE UNIQUE(user_id, product_id))
        await pool.execute(
            `INSERT INTO cart (user_id, product_id, so_luong) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE so_luong = so_luong + VALUES(so_luong)`,
            [userId, product_id, so_luong]
        );

        res.json({ success: true, message: "Đã thêm vào giỏ hàng thành công!" });

    } catch (error) {
        console.error("POST CART ERROR:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thêm giỏ hàng" });
    }
});
// 3. Xóa 1 sản phẩm khỏi giỏ hàng
router.delete('/:product_id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.product_id;

        const [result] = await pool.execute(
            'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Sản phẩm không có trong giỏ hàng!" });
        }

        res.json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng!" });
    } catch (error) {
        console.error("DELETE CART ITEM ERROR:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa sản phẩm" });
    }
});

module.exports = router;