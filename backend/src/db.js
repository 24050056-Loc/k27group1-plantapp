const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// KẾT NỐI DATABASE (Cần thiết để truy vấn bảng products)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});
pool.getConnection()

    .then((connection) => {

        console.log("✅ Đã kết nối thành công với Database MySQL!");

        connection.release(); // Trả lại kết nối cho pool sau khi test xong

    })

    .catch((err) => {

        console.error("❌ Lỗi kết nối Database MySQL: ", err.message);

    });

module.exports = pool;