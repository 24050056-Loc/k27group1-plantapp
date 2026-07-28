const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const https = require('https');

// THÔNG TIN CẤU HÌNH MOMO
const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER_CODE';
const accessKey = process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY';
const secretKey = process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY';
const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/success';
const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/momo/ipn';
const momoHost = 'test-payment.momo.vn';
const momoPath = '/v2/gateway/api/create';

// Hàm helper gọi API Momo
const createMomoPayment = (orderId, orderInfo, amount) => {
    return new Promise((resolve, reject) => {
        const requestId = orderId;
        const requestType = 'payWithMethod';
        const extraData = '';
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: 'vi'
        });

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

        const req = https.request(options, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(requestBody);
        req.end();
    });
};

// --- KHAI BÁO ROUTE TẠO THANH TOÁN ---
router.post('/', async (req, res) => {
    try {
        const { orderId, orderInfo, amount } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ success: false, message: "Thiếu orderId hoặc amount" });
        }

        const result = await createMomoPayment(orderId, orderInfo || 'Thanh toan don hang', amount);
        res.json(result);
    } catch (error) {
        console.error("MOMO ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = {
    router,
    createMomoPayment
};