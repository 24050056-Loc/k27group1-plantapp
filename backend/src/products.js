const express = require('express');
const router = express.Router();
const productController = require('./Controller/productController');
const { verifyToken, isAdmin } = require('./middlewares/authadmin');
const pool = require('./db');
// API cho người dùng xem sản phẩm
router.get('/', productController.getAllProducts);

// API cho Admin (Yêu cầu Token và quyền Admin)
router.post('/admin/add', verifyToken, isAdmin, productController.addPlant);
router.put('/admin/edit/:id', verifyToken, isAdmin, productController.updatePlant);
router.delete('/admin/delete/:id', verifyToken, isAdmin, productController.deletePlant);

module.exports = router;

// 1. API CHO TRANG SẢN PHẨM (Lấy TẤT CẢ cây trong Database)
// Frontend trang sản phẩm sẽ gọi: fetch('http://localhost:8080/product')
router.get('', async (req, res) => {
    try {
        const query = `SELECT * FROM products ORDER BY gia_tien DESC`;
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi lấy tất cả sản phẩm:", error);
        res.status(500).json({ message: "Lỗi lấy dữ liệu sản phẩm" });
    }
});

// ===================================================
// API TÌM KIẾM SẢN PHẨM
// Frontend gọi: GET /products/search?q=keyword
// ===================================================
router.get('/search', async (req, res) => {
    try {
        const keyword = (req.query.q || '').trim();
        if (!keyword) {
            return res.json([]);
        }
        const searchTerm = `%${keyword}%`;
        const query = `
            SELECT id, ten_san_pham, gia_tien, hinh_anh_url, mo_ta, danh_muc_id
            FROM products
            WHERE ten_san_pham LIKE ? OR mo_ta LIKE ?
            ORDER BY
                CASE WHEN ten_san_pham LIKE ? THEN 0 ELSE 1 END,
                ten_san_pham ASC
            LIMIT 10
        `;
        const [rows] = await pool.execute(query, [searchTerm, searchTerm, `${keyword}%`]);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi tìm kiếm sản phẩm:", error);
        res.status(500).json({ message: "Lỗi tìm kiếm sản phẩm" });
    }
});

// ===================================================
// 1. API CHO TRANG CHỦ - Phải khai báo TRƯỚC route '/'
// Frontend gọi: GET /products/featured
// ===================================================
router.get('/featured', async (req, res) => {
    try {
        const query = `SELECT * FROM products ORDER BY gia_tien DESC LIMIT 6`;
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi lấy 6 sản phẩm:", error);
        res.status(500).json({ message: "Lỗi lấy dữ liệu sản phẩm" });
    }
});

// ===================================================
// 2. API CHO TRANG SẢN PHẨM - Lấy tất cả sản phẩm
// Frontend gọi: GET /products
// ===================================================
router.get('/', productController.getAllProducts);

// ===================================================
// 3. API CHO ADMIN (Yêu cầu Token và quyền Admin)
// ===================================================
router.post('/admin/add', verifyToken, isAdmin, productController.addPlant);
router.put('/admin/edit/:id', verifyToken, isAdmin, productController.updatePlant);
router.delete('/admin/delete/:id', verifyToken, isAdmin, productController.deletePlant);

module.exports = router;