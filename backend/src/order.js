const express = require('express');
const router = express.Router();
const orderController = require('./Controller/orderController.js');
const pool = require('./db.js');

/**
 * LƯU Ý QUAN TRỌNG: 
 * Nếu file sever.js bạn viết: app.use('/order', orderRouter)
 * Thì ở Frontend (checkout.html) API_URL phải là: http://localhost:8080/order
 */

// 1. Lấy tất cả đơn hàng (Dùng cho trang Admin)
router.get('/', orderController.getAllOrders);

// 2. Tạo mới đơn hàng (Dùng cho trang Checkout của khách)
// Frontend gọi: fetch(API_URL, { method: 'POST', ... })
router.post('/', orderController.createOrder);

// 3. Lấy chi tiết 1 đơn hàng
router.get('/:id', orderController.getOrderById);

// 4. Cập nhật trạng thái (Dùng cho Admin duyệt đơn)
router.put('/:id', orderController.updateOrderStatus);


module.exports = router;