require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        // Kiểm tra xem cột đã tồn tại chưa
        const [existing] = await pool.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA=? AND TABLE_NAME='orders' AND COLUMN_NAME='phuong_thuc_thanh_toan'`,
            [process.env.DB_NAME]
        );

        if (existing.length === 0) {
            await pool.execute(`
                ALTER TABLE orders 
                ADD COLUMN phuong_thuc_thanh_toan 
                ENUM('cod', 'bank_transfer') DEFAULT 'cod' 
                AFTER dia_chi_giao_hang
            `);
            console.log('✅ Đã thêm cột phuong_thuc_thanh_toan vào bảng orders.');
        } else {
            console.log('ℹ️  Cột phuong_thuc_thanh_toan đã tồn tại, bỏ qua.');
        }

        // =====================================================
        // CẬP NHẬT DỮ LIỆU CŨ: suy ra phương thức từ trang_thai
        // - dang_xu_ly           → bank_transfer (đã thanh toán QR)
        // - da_thu/da_xu_ly      → cod (đã thu COD)
        // - da_thu/da_xac_nhan   → cod (đã thu COD)
        // =====================================================
        const [r1] = await pool.execute(`
            UPDATE orders 
            SET phuong_thuc_thanh_toan = 'bank_transfer'
            WHERE trang_thai = 'dang_xu_ly'
        `);
        console.log(`✅ Cập nhật ${r1.affectedRows} đơn [dang_xu_ly] → bank_transfer (QR)`);

        const [r2] = await pool.execute(`
            UPDATE orders 
            SET phuong_thuc_thanh_toan = 'cod'
            WHERE trang_thai IN ('da_thu/da_xu_ly', 'da_thu/da_xac_nhan')
        `);
        console.log(`✅ Cập nhật ${r2.affectedRows} đơn [da_thu/*] → cod (COD)`);

        // Hiển thị kết quả
        const [cols] = await pool.execute(
            `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA=? AND TABLE_NAME='orders' 
             ORDER BY ORDINAL_POSITION`,
            [process.env.DB_NAME]
        );
        console.log('\nCấu trúc bảng orders:');
        cols.forEach(c => console.log(` - ${c.COLUMN_NAME} [${c.DATA_TYPE}] default: ${c.COLUMN_DEFAULT}`));

        // Hiển thị các đơn hàng hiện tại
        const [orders] = await pool.execute(
            `SELECT id, trang_thai, phuong_thuc_thanh_toan FROM orders ORDER BY id DESC LIMIT 15`
        );
        console.log('\nCác đơn hàng hiện tại:');
        orders.forEach(o => console.log(` #${o.id} | ${o.trang_thai} | ${o.phuong_thuc_thanh_toan}`));

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await pool.end();
    }
})();

