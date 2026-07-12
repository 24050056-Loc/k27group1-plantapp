require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDB() {
    console.log("Connecting to Database:", process.env.DB_HOST);
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();
        console.log("Connected successfully. Running migrations...");

        try {
            await connection.execute(`ALTER TABLE orders ADD COLUMN phuong_thuc_thanh_toan VARCHAR(50) DEFAULT 'cod'`);
            console.log("Added column phuong_thuc_thanh_toan");
        } catch (e) {
            console.log("Column phuong_thuc_thanh_toan might already exist:", e.message);
        }

        try {
            await connection.execute(`ALTER TABLE orders ADD COLUMN trang_thai_thanh_toan VARCHAR(50) DEFAULT 'chua_thanh_toan'`);
            console.log("Added column trang_thai_thanh_toan");
        } catch (e) {
            console.log("Column trang_thai_thanh_toan might already exist:", e.message);
        }

        connection.release();
        console.log("DB update completed.");
        process.exit(0);
    } catch (e) {
        console.error("DB connection/update failed:", e);
        process.exit(1);
    }
}

updateDB();
