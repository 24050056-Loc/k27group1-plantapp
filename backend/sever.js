const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware QUAN TRỌNG
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Cho phép nhận dữ liệu dạng x-www-form-urlencoded
app.use(cors());

// ==========================================
// 1. IMPORT CÁC FILE ROUTES
// ==========================================
const productsRoutes = require('./src/products');
const authRoutes = require('./src/auth');
const categoriesRoutes = require('./src/categories');
const contactRoutes = require('./src/lienhe');
const checkoutRoutes = require('./src/checkout');
const aboutRoutes = require('./src/gioithieu');
const cartRoutes = require('./src/cart');
const usersRoutes = require('./src/users');
const ordersRoutes = require('./src/orders'); // Đã thêm dấu ;
const mobileRoutes = require('./src/mobile');
const couponsRoutes = require('./src/coupons');
const promotional_eventsRoutes = require('./src/promotional_events');
const minigameRoutes = require('./src/minigame');
const paymentRoutes = require('./src/payment');
const { router: momoRoutes } = require('./src/momo');
const waterRoutes = require('./src/water');
const cronjobRoutes = require('./src/cronjob');
const communityRoutes = require('./src/community');

// Các route Admin
const adminRoutes = require('./src/admin');
const adminproductsRoutes = require('./src/adminproducts');
const adminorderRoutes = require('./src/adminorder');
const adminusersRoutes = require('./src/adminusers');

// ==========================================
// 2. SỬ DỤNG CÁC ROUTES (Đã gom cụm)
// ==========================================
// Cụm Route người dùng công cộng
app.use('/products', productsRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/lienhe', contactRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/gioithieu', aboutRoutes);
app.use('/cart', cartRoutes);
app.use('/users', usersRoutes);
app.use('/orders', ordersRoutes);
app.use('/mobile', mobileRoutes);
app.use('/coupons', couponsRoutes);
app.use('/promotional_events', promotional_eventsRoutes);
app.use('/api/game', minigameRoutes);
app.use('/payment', paymentRoutes);
app.use('/momo', momoRoutes);
app.use('/water', waterRoutes);
app.use('/cronjob', cronjobRoutes);
app.use('/community', communityRoutes);

// Cụm Route Admin
app.use('/admin', adminRoutes);
app.use('/adminproducts', adminproductsRoutes);
app.use('/adminorder', adminorderRoutes);
app.use('/adminusers', adminusersRoutes);

// ==========================================
// 3. KHỞI CHẠY SERVER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🌐 LAN IP: http://192.168.190.239:${PORT}`);
});