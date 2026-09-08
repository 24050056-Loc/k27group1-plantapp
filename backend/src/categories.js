const express = require('express');
const router = express.Router();
const pool = require('./db.js');
const mysql = require('mysql2/promise');


// Lấy danh mục cho trang chủ
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM categories');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// Thêm danh mục
router.post('/', async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        const [result] = await pool.execute('INSERT INTO categories (ten_danh_muc, mo_ta) VALUES (?, ?)', [ten_danh_muc, mo_ta || '']);
        res.json({ success: true, message: "Thêm thành công", id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// Sửa danh mục
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_danh_muc, mo_ta } = req.body;
        await pool.execute('UPDATE categories SET ten_danh_muc = ?, mo_ta = ? WHERE id = ?', [ten_danh_muc, mo_ta || '', id]);
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// Xóa danh mục
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

module.exports = router;