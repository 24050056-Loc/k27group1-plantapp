const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { verifyToken, isAdmin } = require('../../middlewares/authadmin');

// GET /api/admin_dashboard/stats
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const [[{ total_users }]] = await pool.execute("SELECT COUNT(*) as total_users FROM users");
        const [[{ new_users }]] = await pool.execute("SELECT COUNT(*) as new_users FROM users WHERE DATE(ngay_tao) = CURDATE()");
        const [[{ active_users }]] = await pool.execute("SELECT COUNT(*) as active_users FROM users WHERE dang_hoat_dong = 1");
        
        const [[{ total_products }]] = await pool.execute("SELECT COUNT(*) as total_products FROM products");
        const [[{ total_categories }]] = await pool.execute("SELECT COUNT(*) as total_categories FROM categories");
        const [[{ in_stock }]] = await pool.execute("SELECT COUNT(*) as in_stock FROM products WHERE so_luong_kho > 0");
        const [[{ out_of_stock }]] = await pool.execute("SELECT COUNT(*) as out_of_stock FROM products WHERE so_luong_kho <= 0");
        
        const [[{ total_orders }]] = await pool.execute("SELECT COUNT(*) as total_orders FROM orders");
        const [[{ pending_orders }]] = await pool.execute("SELECT COUNT(*) as pending_orders FROM orders WHERE trang_thai = 'cho_duyet'");
        const [[{ delivering_orders }]] = await pool.execute("SELECT COUNT(*) as delivering_orders FROM orders WHERE trang_thai = 'dang_giao'");
        const [[{ completed_orders }]] = await pool.execute("SELECT COUNT(*) as completed_orders FROM orders WHERE trang_thai = 'da_giao' OR trang_thai LIKE 'da_thu%' OR trang_thai = 'hoan_thanh'");
        const [[{ cancelled_orders }]] = await pool.execute("SELECT COUNT(*) as cancelled_orders FROM orders WHERE trang_thai = 'da_huy'");
        
        const [[{ total_revenue }]] = await pool.execute("SELECT SUM(tong_tien_hang - so_tien_giam_gia) as total_revenue FROM orders WHERE trang_thai NOT IN ('da_huy', 'cho_duyet')");
        const [[{ today_revenue }]] = await pool.execute("SELECT SUM(tong_tien_hang - so_tien_giam_gia) as today_revenue FROM orders WHERE trang_thai NOT IN ('da_huy', 'cho_duyet') AND DATE(ngay_dat_hang) = CURDATE()");
        const [[{ month_revenue }]] = await pool.execute("SELECT SUM(tong_tien_hang - so_tien_giam_gia) as month_revenue FROM orders WHERE trang_thai NOT IN ('da_huy', 'cho_duyet') AND MONTH(ngay_dat_hang) = MONTH(CURDATE()) AND YEAR(ngay_dat_hang) = YEAR(CURDATE())");
        
        res.json({
            success: true,
            data: {
                users: { total: total_users || 0, new: new_users || 0, active: active_users || 0 },
                products: { total: total_products || 0, categories: total_categories || 0, inStock: in_stock || 0, outOfStock: out_of_stock || 0 },
                orders: { total: total_orders || 0, pending: pending_orders || 0, delivering: delivering_orders || 0, completed: completed_orders || 0, cancelled: cancelled_orders || 0 },
                revenue: { total: total_revenue || 0, today: today_revenue || 0, month: month_revenue || 0 }
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Lỗi thống kê" });
    }
});

module.exports = router;
