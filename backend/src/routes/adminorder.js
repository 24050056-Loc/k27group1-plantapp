const express = require('express');
const router = express.Router();
const pool = require('../db');

// Lấy danh sách đơn hàng kèm tên khách (Dùng JOIN)
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT o.id, o.user_id, o.tong_tien_hang, o.so_tien_giam_gia,
                   o.tong_thanh_toan, o.trang_thai, o.dia_chi_giao_hang,
                   o.ngay_dat_hang, o.ma_giam_gia,
                   u.ho_ten, u.so_dien_thoai, u.email
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.id DESC`;
        const [rows] = await pool.execute(sql);
        // Trả về { success: true, data: [...] } theo yêu cầu của orders.html
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Lỗi lấy đơn hàng adminorder:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy đơn hàng: " + error.message });
    }
});

function normalizeOrderStatus(st) {
    if (!st) return '';
    const s = String(st).toLowerCase().trim();
    if (['cho_duyet', 'cho_xu_ly', 'dang_xu_ly'].includes(s)) return 'cho_xu_ly';
    if (s === 'dang_giao') return 'dang_giao';
    if (['hoan_thanh', 'da_giao'].includes(s) || s.startsWith('da_thu')) return 'hoan_thanh';
    if (s === 'da_huy') return 'da_huy';
    return s;
}

const ORDER_STATUS_LABELS = {
    cho_xu_ly: "Chờ xử lý",
    dang_giao: "Đang giao",
    hoan_thanh: "Hoàn thành",
    da_huy: "Đã hủy"
};

const ALLOWED_ORDER_TRANSITIONS = {
    cho_xu_ly: ['dang_giao', 'da_huy'],
    dang_giao: ['hoan_thanh'],
    hoan_thanh: [], // Trạng thái cuối: không được chuyển nữa
    da_huy: []       // Trạng thái cuối: không được chuyển nữa
};

// Cập nhật trạng thái đơn hàng (/:id/status) - Bắt buộc kiểm tra quy tắc một chiều
router.put('/:id/status', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const rawStatus = req.body.status || req.body.trang_thai;

        if (!rawStatus) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp trạng thái mới ('trang_thai' hoặc 'status')!" });
        }

        const [[order]] = await conn.execute('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
        if (!order) {
            return res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng #${id}!` });
        }

        const currentNorm = normalizeOrderStatus(order.trang_thai);
        const targetNorm = normalizeOrderStatus(rawStatus);

        if (currentNorm === targetNorm) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng đã ở trạng thái '${ORDER_STATUS_LABELS[currentNorm] || order.trang_thai}'.`
            });
        }

        const allowedTargets = ALLOWED_ORDER_TRANSITIONS[currentNorm] || [];
        if (!allowedTargets.includes(targetNorm)) {
            const currentLabel = ORDER_STATUS_LABELS[currentNorm] || order.trang_thai;
            const targetLabel = ORDER_STATUS_LABELS[targetNorm] || rawStatus;

            return res.status(400).json({
                success: false,
                message: `Không thể chuyển đơn hàng từ '${currentLabel}' sang '${targetLabel}'. Trạng thái đơn hàng chỉ được chuyển theo một chiều.`
            });
        }

        await conn.beginTransaction();

        const saveStatus = (targetNorm === 'hoan_thanh') ? 'hoan_thanh' : targetNorm;
        await conn.execute('UPDATE orders SET trang_thai = ? WHERE id = ?', [saveStatus, id]);

        await conn.execute(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, ghi_chu)
             VALUES (?, ?, ?, ?, ?)`,
            [id, order.trang_thai, saveStatus, req.user?.id || null, req.body.ghi_chu || 'Admin chuyển trạng thái']
        );

        if (targetNorm === 'da_huy') {
            const [orderItems] = await conn.execute(
                'SELECT product_id, so_luong FROM order_items WHERE order_id = ?',
                [id]
            );
            for (const item of orderItems) {
                await conn.execute(
                    'UPDATE products SET so_luong_kho = so_luong_kho + ? WHERE id = ?',
                    [item.so_luong, item.product_id]
                );
            }

            await conn.execute(
                `UPDATE user_coupons
                 SET status = 'available', used_at = NULL, used_order_id = NULL
                 WHERE used_order_id = ?`,
                [String(id)]
            );
            if (order.coupon_id) {
                await conn.execute(
                    `UPDATE user_coupons
                     SET status = 'available', used_at = NULL, used_order_id = NULL
                     WHERE id = ?`,
                    [order.coupon_id]
                );
            }
        }

        await conn.commit();

        const [[updatedOrder]] = await pool.execute(`
            SELECT o.*, u.ho_ten, u.so_dien_thoai, u.email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [id]);

        res.json({
            success: true,
            message: `Đã chuyển trạng thái đơn hàng sang '${ORDER_STATUS_LABELS[targetNorm]}'`,
            data: updatedOrder
        });
    } catch (error) {
        await conn.rollback();
        console.error("Lỗi cập nhật trạng thái đơn adminorder:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái đơn: " + error.message });
    } finally {
        conn.release();
    }
});

// Cập nhật thông tin giao hàng (/:id/info)
router.put('/:id/info', async (req, res) => {
    const { id } = req.params;
    const { dia_chi_giao_hang } = req.body;
    try {
        await pool.execute('UPDATE orders SET dia_chi_giao_hang = ? WHERE id = ?', [dia_chi_giao_hang, id]);
        res.json({ success: true, message: "Cập nhật địa chỉ giao hàng thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật thông tin đơn hàng" });
    }
});

// Xóa đơn hàng — Cấm xóa cứng đơn hàng đã phát sinh để bảo toàn lịch sử
router.delete('/:id', async (req, res) => {
    return res.status(403).json({
        success: false,
        message: "Không được xóa đơn hàng đã phát sinh. Đơn hàng phải được lưu giữ toàn vẹn trong lịch sử hệ thống."
    });
});

module.exports = router;