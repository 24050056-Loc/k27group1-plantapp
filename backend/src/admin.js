const express = require('express');
const router = express.Router();
const pool = require('./db');
const { verifyToken, isAdmin } = require('./middlewares/authadmin');

// API Lấy dữ liệu thống kê tổng quan (Thẻ Card)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        // Tổng doanh thu (Chỉ tính đơn hoàn thành)
        const [[{ total_revenue }]] = await pool.execute(
            "SELECT SUM(tong_tien_hang) as total_revenue FROM orders WHERE trang_thai = 'hoan_thanh'"
        );

        // Số đơn hàng mới (Chờ duyệt)
        const [[{ new_orders }]] = await pool.execute(
            "SELECT COUNT(id) as new_orders FROM orders WHERE trang_thai = 'cho_duyet'"
        );

        // Tổng số khách hàng
        const [[{ total_customers }]] = await pool.execute(
            "SELECT COUNT(id) as total_customers FROM users WHERE role = 'user'"
        );

        res.json({
            doanh_thu: total_revenue || 0,
            don_hang_moi: new_orders || 0,
            tong_khach_hang: total_customers || 0
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu thống kê" });
    }
});

// API Lấy dữ liệu cho biểu đồ (Doanh thu 7 ngày gần nhất)
router.get('/revenue-chart', verifyToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT DATE(ngay_dat_hang) as date, SUM(tong_tien_hang) as daily_revenue 
            FROM orders 
            WHERE trang_thai = 'hoan_thanh' 
            AND ngay_dat_hang >= DATE(NOW() - INTERVAL 7 DAY)
            GROUP BY DATE(ngay_dat_hang)
            ORDER BY date ASC
        `;
        const [chartData] = await pool.execute(query);
        res.json(chartData);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu biểu đồ" });
    }
});

module.exports = router;