const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const https = require('https');

// THÔNG TIN CẤU HÌNH MOMO (Lấy từ ví Momo Developer)

// THÔNG TIN CẤU HÌNH MOMO (Lấy từ ví Momo Developer)
// Bạn nên chuyển các biến này vào file .env để bảo mật
const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER_CODE';
const accessKey = process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY';
const secretKey = process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY';
const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/success';
const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/momo/ipn';
const momoHost = 'test-payment.momo.vn'; // Dùng 'payment.momo.vn' cho môi trường production
const momoPath = '/v2/gateway/api/create';

/**
 * Hàm tạo yêu cầu thanh toán Momo
 * @param {string} orderId - Mã đơn hàng duy nhất
 * @param {string} orderInfo - Thông tin mô tả đơn hàng
 * @param {number} amount - Số tiền thanh toán
 * @returns {Promise<Object>} Trả về thông tin thanh toán từ Momo, bao gồm payUrl
 */
const createMomoPayment = (orderId, orderInfo, amount) => {
    return new Promise((resolve, reject) => {
        // Các tham số bắt buộc theo tài liệu Momo
        const requestId = orderId;
        const requestType = 'payWithMethod';
        const extraData = '';
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        // Tạo chữ ký (signature) bằng HMAC SHA256
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Tạo body cho request
        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            accessKey: accessKey,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: 'vi'
        });

        // Tùy chọn cho HTTPS request
        const options = {
            hostname: momoHost,
            port: 443,
            path: momoPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        // Gửi request đến Momo
        const req = https.request(options, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        // Ghi dữ liệu vào request body
        req.write(requestBody);
        req.end();
    });
};

module.exports = {
    createMomoPayment
};
module.exports = router;