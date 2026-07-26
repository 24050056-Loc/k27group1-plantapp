require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDB() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [tables] = await pool.query('SHOW TABLES');
        console.log("=== DANH SÁCH CÁC BẢNG TRONG DATABASE ===");
        console.log(tables.map(t => Object.values(t)[0]));
        
        process.exit(0);
    } catch (e) {
        console.error("Lỗi:", e);
        process.exit(1);
    }
}

checkDB();
