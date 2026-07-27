const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const OrderModel = require('./model/orderModel');
const { createMomoPayment } = require('./momo');

// Các thông số cấu hình Momo (Nên để trong file .env để bảo mật)
const accessKey = process.env.MOMO_ACCESS_KEY || 'YOUR_ACCESS_KEY';
const secretKey = process.env.MOMO_SECRET_KEY || 'YOUR_SECRET_KEY';

// 1. API Thanh toán qua chuyển khoản ngân hàng (Bank Transfer)
router.post('/bank', (req, res) => {
    const { amount, orderId, orderInfo } = req.body;

    res.json({
        success: true,
        message: 'Vui lòng thực hiện chuyển khoản với thông tin dưới đây.',
        data: {
            bankName: 'Vietcombank',
            accountNumber: '0123456789',
            accountName: 'SHOP BAN CAY',
            amount: amount,
            transferContent: `Thanh toan don hang ${orderId}`
        }
    });
});

// 2. API Tạo giao dịch thanh toán Momo
router.post('/momo', async (req, res) => {
    try {
        const { amount, orderId, orderInfo } = req.body;
        
        // Sử dụng hàm createMomoPayment từ momo.js mà mình vừa viết lúc nãy
        const responseData = await createMomoPayment(orderId, orderInfo || `Thanh toán đơn hàng ${orderId}`, amount);
        
        if (responseData.payUrl) {
            // Trả về đường dẫn để frontend chuyển hướng người dùng tới trang thanh toán Momo
            res.json({ success: true, payUrl: responseData.payUrl });
        } else {
            res.status(400).json({ success: false, message: 'Lỗi khi tạo giao dịch Momo', data: responseData });
        }
    } catch (error) {
        console.error('Lỗi Momo:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// 3. API Webhook (IPN) để nhận kết quả thanh toán từ Momo
router.post('/momo-ipn', async (req, res) => {
    // Momo sẽ gọi endpoint này ở background khi khách hàng thanh toán xong
    const {
        partnerCode, orderId, requestId, amount, orderInfo,
        orderType, transId, resultCode, message, payType,
        responseTime, extraData, signature
    } = req.body;

    // Kiểm tra chữ ký để đảm bảo request này thực sự được gửi từ Momo
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature === expectedSignature) {
        if (resultCode == 0) {
            // Thanh toán thành công, CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG TRONG DATABASE LÀ ĐÃ THANH TOÁN
            console.log(`[MoMo] Thanh toán thành công đơn hàng: ${orderId}`);
            await OrderModel.updateStatus(orderId, 'da_thanh_toan');
        } else {
            // Thanh toán thất bại hoặc hủy, CẬP NHẬT LÀ THẤT BẠI
            console.log(`[MoMo] Thanh toán thất bại đơn hàng: ${orderId}, Lý do: ${message}`);
            await OrderModel.updateStatus(orderId, 'thanh_toan_that_bai');
        }
        // Trả về HTTP 204 No Content cho Momo biết hệ thống đã nhận được webhook
        res.status(204).send();
    } else {
        res.status(400).json({ message: 'Chữ ký webhook không hợp lệ' });
    }
});

module.exports = router;
