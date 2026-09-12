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
            // Kiểm tra người dùng có bật thông báo nhắc nhở chăm sóc cây ảo (notif_on = 1)
            const sqlCheck = `
                SELECT ep.user_id, ep.stage, ep.water_turns, u.ho_ten, u.email
                FROM event_progress ep
                LEFT JOIN users u ON ep.user_id = u.id
                WHERE ep.notif_on = 1 AND ep.selected_seed IS NOT NULL
            `;
            const [usersNeedWater] = await pool.execute(sqlCheck);

            if (usersNeedWater.length > 0) {
                usersNeedWater.forEach(user => {
                    console.log(`🔔 [THÔNG BÁO] Nhắc nhở User ID ${user.user_id} (${user.ho_ten || 'Khách'}): "Cây ảo giai đoạn ${user.stage} cần được chăm sóc để nhận voucher!"`);
                });
            } else {
                console.log('✅ [CRONJOB] Không có cây nào cần tưới lúc này.');
            }
        } catch (error) {
            console.error('❌ [CRONJOB] Lỗi khi kiểm tra lịch tưới cây:', error.message);
        }
    });
};

module.exports = { router, startCronJobs };
