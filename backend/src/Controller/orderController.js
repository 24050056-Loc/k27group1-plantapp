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

    // 2. Lấy chi tiết 1 đơn hàng
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
            res.status(200).json(order);
        } catch (error) {
            console.error("Lỗi get order by id:", error);
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // 3. Cập nhật trạng thái đơn hàng
    updateOrderStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const updatedOrder = await Order.updateStatus(req.params.id, status);
            
            if (!updatedOrder) return res.status(404).json({ message: "Đơn hàng không tồn tại" });
            
            res.status(200).json({ message: "Cập nhật thành công", updatedOrder });
        } catch (error) {
            console.error("Lỗi update status:", error);
            res.status(500).json({ message: "Cập nhật thất bại", error: error.message });
        }
    },

    // 4. Tạo đơn hàng mới
    createOrder: async (req, res) => {
        try {
            const newOrderId = await Order.create(req.body);
            // Quan trọng: Trả về success: true để Frontend hiện màn hình thành công
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