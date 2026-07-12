const pool = require('../db');

const Order = {
    // 1. Lấy toàn bộ đơn hàng
    getAll: async () => {
        const sql = `SELECT * FROM orders ORDER BY orderDate DESC`;
        const [rows] = await pool.execute(sql);
        return rows;
    },

    // 2. Lấy chi tiết 1 đơn hàng
    findById: async (id) => {
        const sql = `SELECT * FROM orders WHERE id = ?`;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    },

    // 3. Cập nhật trạng thái
    updateStatus: async (id, status) => {
        const sql = `UPDATE orders SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status, id]);
        return await Order.findById(id); 
    },

    // 4. Tạo đơn hàng mới (ĐÃ THÊM VÀ FIX LỖI TÊN BIẾN)
    // Tạo đơn hàng mới - Đã sửa lỗi Unknown column khớp với Database
    create: async (orderData) => {
        const { user_id, tong_tien_hang, dia_chi_giao_hang, phuong_thuc_thanh_toan, trang_thai, items } = orderData;
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Dùng trang_thai từ frontend, mặc định là 'cho_duyet' nếu không có
            const finalStatus = trang_thai || 'cho_duyet';
            const finalPayment = phuong_thuc_thanh_toan === 'bank_transfer' ? 'bank_transfer' : 'cod';
            
            const sqlOrder = `
                INSERT INTO orders (user_id, tong_tien_hang, dia_chi_giao_hang, phuong_thuc_thanh_toan, trang_thai) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await connection.execute(sqlOrder, [
                user_id || null, 
                tong_tien_hang || 0, 
                dia_chi_giao_hang || null,
                finalPayment,
                finalStatus
            ]);

            
            const orderId = result.insertId;

            if (items && items.length > 0) {
                for (let item of items) {
                    const [stockRows] = await connection.execute(`SELECT so_luong_kho, ten_san_pham FROM products WHERE id = ?`, [item.product_id]);
                    if (stockRows.length === 0) throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`);
                    if (stockRows[0].so_luong_kho < item.so_luong) throw new Error(`Sản phẩm ${stockRows[0].ten_san_pham} không đủ số lượng trong kho`);

                    await connection.execute(
                        `INSERT INTO order_items (order_id, product_id, so_luong, gia_luc_mua) VALUES (?, ?, ?, ?)`,
                        [orderId, item.product_id, item.so_luong, item.gia_luc_mua]
                    );

                    await connection.execute(
                        `UPDATE products SET so_luong_kho = so_luong_kho - ? WHERE id = ?`,
                        [item.so_luong, item.product_id]
                    );
                }
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = Order;