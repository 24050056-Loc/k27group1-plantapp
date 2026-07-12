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
// 2. API CHO TRANG CHỦ (Chỉ lấy Top 6 cây)
// Frontend trang chủ sẽ gọi: fetch('http://localhost:8080/product/featured')
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

module.exports = router;