const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'tree_shop_db'
        });

        console.log('--- Đang kiểm tra cấu trúc bảng users ---');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'
        `, [process.env.DB_NAME || 'tree_shop_db']);

        if (columns.length > 0) {
            console.log('✅ Cột "google_id" đã tồn tại trong bảng users. Không cần thêm.');
        } else {
            console.log('⏳ Đang thêm cột "google_id" vào bảng users...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER email
            `);
            console.log('✅ Thêm cột "google_id" vào bảng users thành công!');
        }

        console.log('--- Hoàn tất kiểm tra Database Migration ---');
    } catch (error) {
        console.error('❌ Lỗi migration:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
