const express = require('express');
const router = express.Router();
const productController = require('./Controller/productController');
const { verifyToken, isAdmin } = require('./middlewares/authadmin');
const pool = require('./db');

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