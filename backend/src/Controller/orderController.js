const Order = require('../model/orderModel');

const orderController = {
    // 1. Lấy toàn bộ đơn hàng (Cho Admin)
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.getAll();
            res.status(200).json(orders);
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

            // Trả về gộp chung dữ liệu tổng quan và chi tiết
            res.status(200).json({
                ...order,
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

    // 4. Tạo đơn hàng mới (Lưu đồng thời orders và order_items)
    createOrder: async (req, res) => {
        try {
            // Tách mảng giỏ hàng 'items' ra khỏi thông tin chung của đơn hàng
            const { items, ...orderData } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: "Đơn hàng phải có ít nhất một sản phẩm trong giỏ hàng." });
            }

            // Bước 1: Lưu thông tin chung vào bảng `orders`
            const newOrderId = await Order.create(orderData);

            // Bước 2: Lưu các sản phẩm trong giỏ vào bảng `order_items`
            await Order.createItems(newOrderId, items);

            res.status(201).json({
                success: true,
                message: "Đặt hàng thành công",
                orderId: newOrderId
            });
        } catch (error) {
            console.error("Lỗi tạo đơn hàng:", error);
            res.status(400).json({
                success: false,
                message: "Không thể tạo đơn hàng",
                error: error.message
            });
        }
    }
};

module.exports = orderController;