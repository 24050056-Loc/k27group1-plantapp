const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/home', async (req, res) => {
    try {
        const [categories] = await pool.execute('SELECT * FROM categories ORDER BY id ASC');
        const [featuredProducts] = await pool.execute(`
            SELECT p.*, c.ten_danh_muc
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.dang_kinh_doanh = 1
            ORDER BY p.ngay_tao DESC, p.gia_tien DESC
            LIMIT 8
        `);
        const [topSellingProducts] = await pool.query(`
            SELECT p.*, c.ten_danh_muc, COALESCE(s.da_ban, 0) AS da_ban
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT product_id, SUM(so_luong) AS da_ban
                FROM order_items
                GROUP BY product_id
            ) s ON s.product_id = p.id
            ORDER BY da_ban DESC, p.ngay_tao DESC
            LIMIT 8
        `);
        const [activeCoupons] = await pool.execute(`
            SELECT * FROM coupons
            WHERE dang_ap_dung = TRUE
            ORDER BY id DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                categories,
                featuredProducts,
                topSellingProducts,
                activeCoupons
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Loi lay du lieu trang chu mobile', error: error.message });
    }
});

module.exports = router;