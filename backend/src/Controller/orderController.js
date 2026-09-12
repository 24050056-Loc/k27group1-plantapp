const Order = require('../model/orderModel');
const pool = require('../db.js');

const orderController = {
    // 1. Lấy toàn bộ đơn hàng (Cho Admin)
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.getAll();
            const shippingFee = 30000;
            const normalizedOrders = orders.map((order) => {
                const subtotal = Number(order.tong_tien_hang || 0);
                const discount = Number(order.so_tien_giam_gia || 0);
                return {
                    ...order,
                    phi_van_chuyen: shippingFee,
                    tong_thanh_toan: Math.max(0, subtotal - discount + shippingFee),
                };
            });
            res.status(200).json(normalizedOrders);
        } catch (error) {
            console.error("Lỗi get orders:", error);
            res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng", error: error.message });
        }
    },

    // 2. Lấy chi tiết 1 đơn hàng + Kèm danh sách sản phẩm bên trong đơn
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

            // Lấy thêm danh sách sản phẩm thuộc đơn hàng này
            const items = await Order.getItemsByOrderId(req.params.id);
            const shippingFee = 30000;
            const finalTotal = Math.max(0, Number(order.tong_tien_hang || 0) - Number(order.so_tien_giam_gia || 0) + shippingFee);

            // Trả về gộp chung dữ liệu tổng quan và chi tiết
            res.status(200).json({
                ...order,
                phi_van_chuyen: shippingFee,
                tong_thanh_toan: finalTotal,
                items: items
            });
        } catch (error) {
            console.error("Lỗi get order by id:", error);
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // 3. Cập nhật trạng thái đơn hàng (Duyệt đơn)
    updateOrderStatus: async (req, res) => {
        try {
            const { status } = req.body; // status truyền lên phải khớp với ENUM trong SQL ('dang_xu_ly', 'da_giao'...)
            const updatedOrder = await Order.updateStatus(req.params.id, status);

            if (!updatedOrder) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

            res.status(200).json({ message: "Cập nhật trạng thái thành công", updatedOrder });
        } catch (error) {
            console.error("Lỗi update status:", error);
            res.status(500).json({ message: "Cập nhật thất bại", error: error.message });
        }
    },

    cancelOrder: async (req, res) => {
        try {
            const userId = req.user.id;
            const cancelledOrder = await Order.cancelByUser(req.params.id, userId);

            if (!cancelledOrder) {
                return res.status(400).json({
                    success: false,
                    message: "Đơn hàng không tồn tại, không thuộc tài khoản này hoặc đã được xử lý."
                });
            }

            res.status(200).json({
                success: true,
                message: "Đã hủy đơn hàng",
                order: cancelledOrder
            });
        } catch (error) {
            console.error("Lỗi hủy đơn hàng:", error);
            res.status(500).json({ success: false, message: "Không thể hủy đơn hàng", error: error.message });
        }
    },

    deleteCancelledOrder: async (req, res) => {
        try {
            const deleted = await Order.deleteCancelledByUser(req.params.id, req.user.id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Chỉ có thể xóa đơn đã hủy thuộc tài khoản của bạn."
                });
            }

            res.json({ success: true, message: "Đã xóa đơn hàng khỏi lịch sử" });
        } catch (error) {
            console.error("Lỗi xóa đơn đã hủy:", error);
            res.status(500).json({ success: false, message: "Không thể xóa đơn hàng", error: error.message });
        }
    },

    // 4. Tạo đơn hàng mới — dùng Transaction + SELECT FOR UPDATE để tránh race condition voucher
    //
    // Quy trình atomic:
    //   1. [Nếu có user_coupon_id] Lock hàng voucher bằng SELECT ... FOR UPDATE
    //   2. Kiểm tra voucher còn available và chưa hết hạn
    //   3. INSERT orders
    //   4. INSERT order_items
    //   5. [Nếu có user_coupon_id] Mark voucher: status='used', used_at=NOW(), used_order_id=orderId
    //   6. COMMIT — mọi bước đều thành công
    //
    // Nếu bất kỳ bước nào lỗi → ROLLBACK toàn bộ, voucher KHÔNG bị đánh dấu.
    createOrder: async (req, res) => {
        const { items, user_coupon_id, ...orderData } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Đơn hàng phải có ít nhất một sản phẩm trong giỏ hàng." });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // ── Bước 1: Kiểm tra & Lock voucher (nếu có) ────────────────────────────
            if (user_coupon_id) {
                const [voucherRows] = await conn.execute(
                    `SELECT id, status, expires_at, code
                     FROM user_coupons
                     WHERE id = ?
                     FOR UPDATE`,           // Pessimistic lock: chặn request khác đọc/ghi hàng này
                    [user_coupon_id]
                );

                if (voucherRows.length === 0) {
                    await conn.rollback();
                    return res.status(404).json({
                        success: false,
                        message: "Voucher không tồn tại."
                    });
                }

                const voucher = voucherRows[0];

                if (voucher.status !== 'available') {
                    await conn.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Voucher này đã được sử dụng. Vui lòng chọn voucher khác.",
                        voucher_code: voucher.code,
                    });
                }

                if (new Date(voucher.expires_at) < new Date()) {
                    await conn.rollback();
                    return res.status(410).json({
                        success: false,
                        message: "Voucher đã hết hạn.",
                        voucher_code: voucher.code,
                    });
                }
            }

            // ── Bước 2: Tạo đơn hàng ────────────────────────────────────────────────
            const newOrderId = await Order.create(orderData, conn);

            // ── Bước 3: Lưu chi tiết sản phẩm ───────────────────────────────────────
            await Order.createItems(newOrderId, items, conn);

            // ── Bước 4: Đánh dấu voucher đã sử dụng ─────────────────────────────────
            if (user_coupon_id) {
                const [markResult] = await conn.execute(
                    `UPDATE user_coupons
                     SET status = 'used',
                         used_at = NOW(),
                         used_order_id = ?
                     WHERE id = ? AND status = 'available'`, // Double-check trước khi ghi
                    [String(newOrderId), user_coupon_id]
                );

                if (markResult.affectedRows === 0) {
                    // Một request khác đã kịp mark trước (không xảy ra nếu FOR UPDATE hoạt động đúng)
                    await conn.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Voucher vừa được sử dụng bởi thao tác khác. Vui lòng thử lại."
                    });
                }

                console.log(`[voucher] userId=${orderData.user_id} coupon=${user_coupon_id} order=${newOrderId} ✅ marked as used`);
            }

            await conn.commit();

            res.status(201).json({
                success: true,
                message: "Đặt hàng thành công",
                orderId: newOrderId
            });
        } catch (error) {
            await conn.rollback();
            console.error("Lỗi tạo đơn hàng:", error);
            res.status(400).json({
                success: false,
                message: "Không thể tạo đơn hàng",
                error: error.message
            });
        } finally {
            conn.release(); // Luôn trả connection về pool dù thành công hay thất bại
        }
    }
};

module.exports = orderController;