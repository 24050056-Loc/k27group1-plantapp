const cron = require('node-cron');
const pool = require('../db.js');
const express = require('express');
const router = express.Router();
// Hàm bắt đầu Cronjob, sẽ được gọi ở file server chính (ví dụ: index.js hoặc app.js)
const startCronJobs = () => {
    console.log('⏳ Đang khởi động Cronjob nhắc nhở tưới cây...');

    // Lên lịch chạy mỗi 1 giờ một lần (bạn có thể đổi thành '*/5 * * * *' để chạy mỗi 5 phút)
    cron.schedule('0 * * * *', async () => {
        console.log('🔍 [CRONJOB] Đang kiểm tra các cây cần tưới nước...');
        try {
            // Logic kiểm tra cây đã hết thời gian chờ tưới
            // Giả sử bảng user_plants có cột 'last_watered_at' và 'watering_interval_hours' (thời gian chờ tính bằng giờ)
            const sqlCheck = `
                SELECT id, user_id, plant_name 
                FROM user_plants 
                WHERE last_watered_at IS NOT NULL 
                  AND NOW() >= DATE_ADD(last_watered_at, INTERVAL watering_interval_hours HOUR)
            `;
            const [plantsNeedWater] = await pool.execute(sqlCheck);

            if (plantsNeedWater.length > 0) {
                plantsNeedWater.forEach(plant => {
                    // Liên kết với hệ thống gửi thông báo (Push Notification, Email, v.v.)
                    // Gửi nhắc nhở cho user_id
                    console.log(`🔔 [THÔNG BÁO] Gửi thông báo đến User ID ${plant.user_id}: "Cây ${plant.plant_name} của bạn đã đến giờ tưới nước để nhận voucher!"`);

                    // TODO: Gọi hàm gửi thông báo thực tế ở đây, ví dụ sendPushNotification(plant.user_id, message)
                });
            } else {
                console.log('✅ [CRONJOB] Không có cây nào cần tưới lúc này.');
            }
        } catch (error) {
            console.error('❌ [CRONJOB] Lỗi khi kiểm tra lịch tưới cây:', error);
        }
    });
};

module.exports = { router, startCronJobs };
