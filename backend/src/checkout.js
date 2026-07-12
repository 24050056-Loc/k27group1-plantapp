const express = require('express');
const router = express.Router();
const pool = require('./db.js');
const authenticateToken = require('./middlewares/authMiddleware.js');

router.post('/', authenticateToken, async (req, res) => {
    // 1. Kiểm tra input cơ bản trước khi mở connection để tiết kiệm tài nguyên
    const { dia_chi_giao_hang } = req.body;
    if (!dia_chi_giao_hang || dia_chi_giao_hang.trim() === "") {
        return res.status(400).json({ success: false, message: "Cần địa chỉ giao hàng hợp lệ!" });
    }

    const userId = req.user.id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Lấy giỏ hàng và đồng thời LOCK các hàng sản phẩm trong bảng products (Tránh Race Condition)
        // Thêm "FOR UPDATE" ở cuối câu SELECT để khóa các hàng sản phẩm này cho đến khi COMMIT
        const [cartItems] = await connection.execute(
            `SELECT c.product_id, c.so_luong, p.gia_tien, p.so_luong_kho, p.ten_san_pham 
             FROM cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = ? FOR UPDATE`,
            [userId]
        );

        if (cartItems.length === 0) {
            throw new Error("Giỏ hàng trống!");
        }

        let tong_tien = 0;
        const orderItemsData = [];

        // 3. Kiểm tra kho và tính toán số tiền
        for (let item of cartItems) {
            if (item.so_luong > item.so_luong_kho) {
                throw new Error(`Sản phẩm ${item.ten_san_pham} không đủ số lượng trong kho!`);
            }
            // Tránh lỗi float bằng cách ép kiểu cẩn thận (hoặc tính theo đơn vị nhỏ nhất nếu cần)
            tong_tien += Number(item.gia_tien) * item.so_luong;
        }

        // 4. Tạo hóa đơn (Orders)
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (user_id, tong_tien_hang, dia_chi_giao_hang) VALUES (?, ?, ?)`,
            [userId, tong_tien, dia_chi_giao_hang]
        );
        const orderId = orderResult.insertId;

        // 5. Tối ưu Queries: Cập nhật kho và chuẩn bị dữ liệu Bulk Insert cho order_items
        for (let item of cartItems) {
            // Cập nhật kho từng sản phẩm (đã được LOCK an toàn bằng FOR UPDATE phía trên)
            await connection.execute(
                `UPDATE products SET so_luong_kho = so_luong_kho - ? WHERE id = ?`,
                [item.so_luong, item.product_id]
            );

            // Gom dữ liệu để Insert hàng loạt
            orderItemsData.push([orderId, item.product_id, item.so_luong, item.gia_tien]);
        }

        // Bulk Insert vào order_items (Chỉ tốn 1 query duy nhất thay vì N câu lệnh trong vòng lặp)
        if (orderItemsData.length > 0) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, so_luong, gia_luc_mua) VALUES ?`,
                [orderItemsData]
            );
        }

        // 6. Xóa giỏ hàng
        await connection.execute(`DELETE FROM cart WHERE user_id = ?`, [userId]);

        // Hoàn tất transaction thành công
        await connection.commit();
        res.json({ success: true, message: "Đặt hàng thành công!", order_id: orderId });

    } catch (error) {
        // Hoàn tác nếu có bất kỳ lỗi nào xảy ra
        await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        // Luôn giải phóng connection trả lại cho pool
        connection.release();
    }
});

modules.exports = router;