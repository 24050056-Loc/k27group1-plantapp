const express = require('express');
const router = express.Router();
const pool = require('./db');

// 1. Lấy danh sách sản phẩm (có hỗ trợ filter qua query params)
// GET /adminproducts?search=&category_id=&status=&stock=
router.get('/', async (req, res) => {
    try {
        const { search, category_id, status, stock } = req.query;

        let conditions = [];
        let params = [];

        if (search && search.trim() !== '') {
            conditions.push(`(p.ten_san_pham LIKE ? OR p.mo_ta LIKE ? OR p.id = ?)`);
            const term = `%${search.trim()}%`;
            params.push(term, term, parseInt(search.trim()) || 0);
        }

        if (category_id && category_id !== 'all') {
            conditions.push(`p.category_id = ?`);
            params.push(parseInt(category_id));
        }

        if (status && status !== 'all') {
            if (status === 'active') {
                conditions.push(`p.dang_kinh_doanh = 1`);
            } else if (status === 'inactive') {
                conditions.push(`p.dang_kinh_doanh = 0`);
            }
        }

        if (stock && stock !== 'all') {
            if (stock === 'in_stock') {
                conditions.push(`p.so_luong_kho > 5`);
            } else if (stock === 'low_stock') {
                conditions.push(`p.so_luong_kho > 0 AND p.so_luong_kho <= 5`);
            } else if (stock === 'out_stock') {
                conditions.push(`p.so_luong_kho <= 0`);
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT p.*, c.ten_danh_muc as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause} ORDER BY p.id DESC`;

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
        res.status(500).json({ message: "Lỗi lấy sản phẩm", error: error.message });
    }
});

// 2. Thêm sản phẩm mới
router.post('/admin/add', async (req, res) => {
    const { ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh } = req.body;

    try {
        const sql = `
            INSERT INTO products (ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await pool.execute(sql, [
            ten_san_pham,
            gia_tien,
            so_luong_kho,
            category_id || null,
            hinh_anh_url,
            dang_kinh_doanh === true || dang_kinh_doanh === 'true' ? 1 : 0
        ]);

        res.status(201).json({ success: true, message: "Thêm thành công!" });
    } catch (error) {
        console.error("LỖI SQL KHI THÊM:", error.sqlMessage);
        res.status(500).json({ success: false, message: "Lỗi Database: " + error.sqlMessage });
    }
});

// 3. Cập nhật sản phẩm
router.put('/admin/update/:id', async (req, res) => {
    const { id } = req.params;
    const { ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh } = req.body;

    try {
        const sql = `
            UPDATE products 
            SET ten_san_pham=?, gia_tien=?, so_luong_kho=?, category_id=?, hinh_anh_url=?, dang_kinh_doanh=? 
            WHERE id=?
        `;

        await pool.execute(sql, [
            ten_san_pham, gia_tien, so_luong_kho, category_id || null, hinh_anh_url,
            dang_kinh_doanh === true || dang_kinh_doanh === 'true' ? 1 : 0,
            id
        ]);

        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (error) {
        console.error("LỖI SQL KHI SỬA:", error.sqlMessage);
        res.status(500).json({ success: false, message: "Lỗi Database: " + error.sqlMessage });
    }
});

// 4. Xóa sản phẩm
router.delete('/admin/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
        res.json({ success: true, message: "Xóa thành công!" });
    } catch (error) {
        console.error("LỖI SQL KHI XÓA:", error.sqlMessage);
        res.status(500).json({ success: false, message: "Lỗi Database: " + error.sqlMessage });
    }
});

module.exports = router;