const pool = require('../db.js'); // Hãy đảm bảo đường dẫn tới file kết nối DB này chính xác

const Order = {
    // 1. Lấy toàn bộ đơn hàng (Đã sửa chuẩn cột ngay_dat_hang)
    getAll: async () => {
        const query = 'SELECT * FROM orders ORDER BY ngay_dat_hang DESC';

        // Thêm dòng này vào để xem Terminal có in ra không
        console.log("=== HỆ THỐNG ĐANG CHẠY CÂU LỆNH SQL NÀY: ===", query);

        const [rows] = await pool.execute(query);
        return rows;
    },

    // 2. Tìm chi tiết một đơn hàng theo ID tổng quan
    findById: async (id) => {
        const query = 'SELECT * FROM orders WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        if (rows.length === 0) return null;
        return rows[0];
    },

    // 3. Cập nhật trạng thái đơn hàng (Khớp cột trang_thai)
    updateStatus: async (id, status) => {
        const query = 'UPDATE orders SET trang_thai = ? WHERE id = ?';
        const [result] = await pool.execute(query, [status, id]);
        if (result.affectedRows === 0) return null;
        return { id, status };
    },

    // 4. Tạo mới thông tin chung của đơn hàng
    create: async (orderData) => {
        const { id, user_id, coupon_id, tong_tien_hang, so_tien_giam_gia, dia_chi_giao_hang } = orderData;

        const query = `
            INSERT INTO orders (id, user_id, coupon_id, tong_tien_hang, so_tien_giam_gia, dia_chi_giao_hang, trang_thai) 
            VALUES (?, ?, ?, ?, ?, ?, 'cho_duyet')
        `;

        await pool.execute(query, [
            id,
            user_id,
            coupon_id || null,
            tong_tien_hang,
            so_tien_giam_gia || 0,
            dia_chi_giao_hang
        ]);

        return id;
    },

    // 5. Lưu chi tiết các sản phẩm được mua vào bảng order_items
    createItems: async (orderId, items) => {
        const query = `
            INSERT INTO order_items (order_id, product_id, so_luong, gia_luc_mua) 
            VALUES (?, ?, ?, ?)
        `;

        for (const item of items) {
            await pool.execute(query, [
                orderId,
                item.product_id,
                item.so_luong,
                item.gia_luc_mua
            ]);
        }
        return true;
    },

    // 6. Lấy danh sách sản phẩm thuộc đơn hàng
    getItemsByOrderId: async (orderId) => {
        const query = 'SELECT * FROM order_items WHERE order_id = ?';
        const [rows] = await pool.execute(query, [orderId]);
        return rows;
    }
};

module.exports = Order;