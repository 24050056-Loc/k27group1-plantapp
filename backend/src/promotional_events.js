const express = require('express');
const router = express.Router();
const pool = require('./db.js');

// ==========================================
// API QUẢN LÝ SỰ KIỆN (EVENTS)
// ==========================================

// 1. Lấy danh sách tất cả các sự kiện đang hiển thị
router.get('/', async (req, res) => {
    try {
        // Sửa lệnh SQL: Lọc theo cột dang_hien_thi thay vì trang_thai
        const sql = `SELECT * FROM promotional_events WHERE dang_hien_thi = TRUE ORDER BY ngay_tao DESC`;
        const [rows] = await pool.execute(sql);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi lấy danh sách sự kiện:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sự kiện' });
    }
});

// 2. Lấy chi tiết một sự kiện theo ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT * FROM promotional_events WHERE id = ?`;
        const [rows] = await pool.execute(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Lỗi lấy chi tiết sự kiện:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết sự kiện' });
    }
});

module.exports = router;