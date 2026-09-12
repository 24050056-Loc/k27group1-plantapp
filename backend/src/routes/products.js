const express = require('express');
const router = express.Router();
const productController = require('../Controller/productController');

// 1. API cho Trang chủ - Top 6 sản phẩm đang kinh doanh (Phải đặt trước '/')
router.get('/featured', productController.getFeaturedProducts);

// 2. API cho Cửa hàng (Mall) - Toàn bộ sản phẩm đang kinh doanh
router.get('/', productController.getAllProducts);

module.exports = router;