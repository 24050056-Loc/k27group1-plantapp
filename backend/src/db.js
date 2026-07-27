const mysql = require('mysql2/promise');
require('dotenv').config();

// KẾT NỐI DATABASE
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Nên thêm dòng này để phòng hờ đổi cổng
    waitForConnections: true,
    connectionLimit: 10
});

// Test kết nối khi khởi động server
pool.getConnection()
    .then((connection) => {
        console.log("✅ Đã kết nối thành công với Database MySQL!");
        connection.release(); // Trả lại kết nối cho pool
    })
    .catch((err) => {
        console.error("❌ Lỗi kết nối Database MySQL: ", err.message);
    });

module.exports = pool;