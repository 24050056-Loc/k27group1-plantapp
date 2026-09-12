const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

let dbHost = process.env.DB_HOST || '127.0.0.1';
if (dbHost === 'localhost') {
    dbHost = '127.0.0.1';
}
const dbPort = Number(process.env.DB_PORT) || 3306;

// KẾT NỐI DATABASE
const pool = mysql.createPool({
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '',
    database: process.env.DB_NAME || 'tree_shop_db',
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000
});

// Test kết nối khi khởi động server
pool.getConnection()
    .then((connection) => {
        console.log(`✅ Đã kết nối thành công với Database MySQL! (${dbHost}:${dbPort}/${process.env.DB_NAME})`);
        connection.release(); // Trả lại kết nối cho pool
    })
    .catch((err) => {
        console.error(`❌ Lỗi kết nối Database MySQL (${dbHost}:${dbPort}): `, err.message);
    });

module.exports = pool;