const express = require('express');
const router = express.Router();
const pool = require('./db.js');


// Thêm route GET này để trình duyệt truy cập trực tiếp không bị lỗi 404
router.get('/tuoi-cay', (req, res) => {
    res.json({ message: 'Đây là API tưới cây. Vui lòng gửi request POST kèm body dữ liệu để thực hiện tưới!' });
});
// API: Người dùng thực hiện tưới cây
router.post('/tuoi-cay', async (req, res) => {
    try {
        const { user_id, user_plant_id } = req.body;

        // 1. Cập nhật thời gian tưới cây gần nhất
        // Giả sử bảng user_plants có cột last_watered_at
        const sqlUpdate = `UPDATE user_plants SET last_watered_at = NOW() WHERE id = ? AND user_id = ?`;
        const [result] = await pool.execute(sqlUpdate, [user_plant_id, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cây của bạn.' });
        }

        // 2. Liên kết với Sự kiện: Kiểm tra xem sự kiện "Trồng cây nhận voucher" còn hoạt động không
        // Ta có thể query trực tiếp hoặc import logic nếu có
        const sqlEvent = `SELECT * FROM promotional_events WHERE dang_hien_thi = TRUE AND name LIKE '%voucher%' LIMIT 1`;
        const [events] = await pool.execute(sqlEvent);

        if (events.length > 0) {
            // Sự kiện đang diễn ra -> Cộng điểm kinh nghiệm (XP) cho cây hoặc người dùng
            // Ví dụ: UPDATE user_plants SET xp = xp + 10 WHERE id = ?
            const eventInfo = events[0];
            // ... Logic cộng điểm hoặc phát voucher nếu đủ điểm ...
        }

        res.json({ success: true, message: 'Tưới cây thành công!' });
    } catch (error) {
        console.error('Lỗi khi tưới cây:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
