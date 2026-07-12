const express = require('express');
const router = express.Router();
const pool = require('./db.js');
const authenticateToken = require('./middlewares/authMiddleware.js');

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
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        let { product_id, so_luong } = req.body;

        // --- BƯỚC 1: VALIDATION ĐẦU VÀO ---
        so_luong = parseInt(so_luong, 10);
        if (!product_id || isNaN(so_luong) || so_luong <= 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ! Số lượng phải lớn hơn 0." });
        }

        // --- BƯỚC 2: KIỂM TRA SẢN PHẨM & KHO ---
        const [products] = await pool.execute(
            'SELECT id, so_luong_kho, ten_san_pham FROM products WHERE id = ?',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại!" });
        }

        const product = products[0];

        // --- BƯỚC 3: KIỂM TRA XEM SẢN PHẨM ĐÃ CÓ TRONG GIỎ CHƯA ---
        const [existing] = await pool.execute(
            'SELECT so_luong FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        let so_luong_moi = so_luong;
        if (existing.length > 0) {
            so_luong_moi += existing[0].so_luong;
        }

        // --- BƯỚC 4: CHECK XEM TỔNG SỐ LƯỢNG CÓ VƯỢT QUÁ KHO KHÔNG ---
        if (so_luong_moi > product.so_luong_kho) {
            return res.status(400).json({
                success: false,
                message: `Không thể thêm! Trong kho chỉ còn ${product.so_luong_kho} sản phẩm, giỏ hàng của bạn đang có ${existing.length > 0 ? existing[0].so_luong : 0} sản phẩm.`
            });
        }

        // --- BƯỚC 5: TIẾN HÀNH THÊM / CẬP NHẬT GIỎ HÀNG ---
        if (existing.length > 0) {
            // Có rồi thì cập nhật tổng số lượng mới
            await pool.execute(
                'UPDATE cart SET so_luong = ? WHERE user_id = ? AND product_id = ?',
                [so_luong_moi, userId, product_id]
            );
        } else {
            // Chưa có thì tạo mới
            await pool.execute(
                'INSERT INTO cart (user_id, product_id, so_luong) VALUES (?, ?, ?)',
                [userId, product_id, so_luong]
            );
        }

        res.json({ success: true, message: "Đã thêm vào giỏ hàng thành công!" });

    } catch (error) {
        console.error("POST CART ERROR:", error); // Log lỗi ở server
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thêm giỏ hàng" });
    }
});

// 3. Xóa một item khỏi giỏ hàng
router.delete('/:cartId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartId } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM cart WHERE id = ? AND user_id = ?',
            [cartId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng!" });
        }

        res.json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng!" });
    } catch (error) {
        console.error("DELETE CART ITEM ERROR:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa sản phẩm" });
    }
});

// 4. Cập nhật số lượng item trong giỏ hàng
router.put('/:cartId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartId } = req.params;
        let { so_luong } = req.body;

        so_luong = parseInt(so_luong, 10);
        if (isNaN(so_luong) || so_luong <= 0) {
            return res.status(400).json({ success: false, message: "Số lượng không hợp lệ! Phải lớn hơn 0." });
        }

        // Kiểm tra xem sản phẩm có trong kho đủ không
        const [cartItems] = await pool.execute(
            'SELECT product_id FROM cart WHERE id = ? AND user_id = ?',
            [cartId, userId]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng!" });
        }

        const productId = cartItems[0].product_id;

        // Lấy số lượng trong kho
        const [products] = await pool.execute(
            'SELECT so_luong_kho FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại!" });
        }

        if (so_luong > products[0].so_luong_kho) {
            return res.status(400).json({
                success: false,
                message: `Không thể cập nhật! Trong kho chỉ còn ${products[0].so_luong_kho} sản phẩm.`
            });
        }

        // Cập nhật số lượng mới
        await pool.execute(
            'UPDATE cart SET so_luong = ? WHERE id = ? AND user_id = ?',
            [so_luong, cartId, userId]
        );

        res.json({ success: true, message: "Đã cập nhật số lượng thành công!" });
    } catch (error) {
        console.error("PUT CART ITEM ERROR:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật giỏ hàng" });
    }
});

module.exports = router;