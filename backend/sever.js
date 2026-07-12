const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware QUAN TRỌNG
app.use(express.json());
app.use(cors());

// ==========================================
// 1. IMPORT CÁC FILE ROUTES
// ==========================================
const productRoutes      = require('./src/product');
const authRoutes         = require('./src/auth');
const categoriesRoutes   = require('./src/categories');
const contactRoutes      = require('./src/lienhe');
const checkoutRoutes     = require('./src/checkout');
const aboutRoutes        = require('./src/gioithieu');
const cartRoutes         = require('./src/cart');
const usersRoutes        = require('./src/users');
const orderRoutes        = require('./src/order'); // Đã thêm dấu ;
const mobileRoutes       = require('./src/mobile');
const couponsRoutes      = require('./src/coupons');

// Các route Admin
const adminRoutes        = require('./src/admin');
const adminproductsRoutes = require('./src/adminproducts');
const adminorderRoutes   = require('./src/adminorder');
const adminusersRoutes   = require('./src/adminusers');

console.log('--- KIỂM TRA ROUTE EXPORT ---');
console.log('productRoutes:', typeof productRoutes);
console.log('authRoutes:', typeof authRoutes);
console.log('categoriesRoutes:', typeof categoriesRoutes);
console.log('adminRoutes:', typeof adminRoutes);
console.log('adminproductsRoutes:', typeof adminproductsRoutes);
console.log('adminorderRoutes:', typeof adminorderRoutes);
console.log('adminusersRoutes:', typeof adminusersRoutes);
console.log('-----------------------------');

// ==========================================
// 2. SỬ DỤNG CÁC ROUTES (Đã gom cụm)
// ==========================================
// Cụm Route người dùng công cộng
app.use('/product', productRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/lienhe', contactRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/gioithieu', aboutRoutes);
app.use('/cart', cartRoutes);
app.use('/users', usersRoutes);
app.use('/order', orderRoutes);
app.use('/mobile', mobileRoutes);
app.use('/coupons', couponsRoutes);

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
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let lanIp = 'localhost';
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                lanIp = iface.address;
            }
        }
    }
    console.log(`🌐 LAN IP: http://${lanIp}:${PORT}`);
});