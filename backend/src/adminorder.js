const express = require('express');
const router = express.Router();
const pool = require('./db');

// Lấy danh sách đơn hàng kèm tên khách (Dùng JOIN)
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT o.id, o.user_id, o.tong_tien_hang, o.so_tien_giam_gia,
                   o.tong_thanh_toan, o.trang_thai, o.dia_chi_giao_hang,
                   o.phuong_thuc_thanh_toan, o.ngay_dat_hang,
                   u.ho_ten, u.so_dien_thoai
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.id DESC`;
        const [rows] = await pool.execute(sql);
        // Trả về { success: true, data: [...] } theo yêu cầu của orders.html
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy đơn hàng" });
    }
});

// Cập nhật trạng thái đơn hàng (/:id/status)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { trang_thai } = req.body;
    try {
        await pool.execute('UPDATE orders SET trang_thai = ? WHERE id = ?', [trang_thai, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Xóa đơn hàng (chỉ khi đã hủy)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Kiểm tra xem đơn hàng có phải 'da_huy' không
        const [rows] = await pool.execute('SELECT trang_thai FROM orders WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        if (rows[0].trang_thai !== 'da_huy') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể xóa đơn hàng đã hủy' });
        }

        // Xóa order_items trước (foreign key constraint)
        await pool.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
        
        // Xóa order
        await pool.execute('DELETE FROM orders WHERE id = ?', [id]);

        res.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa đơn hàng' });
    }
});

module.exports = router;