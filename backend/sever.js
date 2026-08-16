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
const productsRoutes = require('./src/routes/products');
const authRoutes = require('./src/routes/auth');
const categoriesRoutes = require('./src/routes/categories');
const contactRoutes = require('./src/routes/lienhe');
const checkoutRoutes = require('./src/routes/checkout');
const aboutRoutes = require('./src/routes/gioithieu');
const cartRoutes = require('./src/routes/cart');
const usersRoutes = require('./src/routes/users');
const ordersRoutes = require('./src/routes/orders'); // Đã thêm dấu ;
const mobileRoutes = require('./src/routes/mobile');
const couponsRoutes = require('./src/routes/coupons');
const promotional_eventsRoutes = require('./src/routes/promotional_events');
const minigameRoutes = require('./src/routes/minigame');
const paymentRoutes = require('./src/routes/payment');
const { router: momoRoutes } = require('./src/routes/momo');
const waterRoutes = require('./src/routes/water');
const { router: cronjobRoutes, startCronJobs } = require('./src/routes/cronjob');
const communityRoutes = require('./src/routes/community');

// Các route Admin
const adminRoutes = require('./src/routes/admin');
const adminproductsRoutes = require('./src/routes/adminproducts');
const adminorderRoutes = require('./src/routes/adminorder');
const adminusersRoutes = require('./src/routes/adminusers');

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
// Bật Cronjob nhắc tưới cây
startCronJobs();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🌐 LAN IP: http://192.168.190.239:${PORT}`);
});