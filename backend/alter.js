const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({ 
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: process.env.DB_NAME 
    });
    
    console.log('Đang cập nhật cột trang_thai...');
    await pool.query("ALTER TABLE orders MODIFY COLUMN trang_thai ENUM('cho_duyet', 'dang_xu_ly', 'dang_giao', 'da_giao', 'da_huy', 'da_thu/da_xu_ly', 'da_thu/da_xac_nhan') DEFAULT 'cho_duyet'");
    
    console.log('✅ ALTER TABLE hoàn tất!');
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Lỗi khi chạy alter.js:', err.message);
    process.exit(1);
});
