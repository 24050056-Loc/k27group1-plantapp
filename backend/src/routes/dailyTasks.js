const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middlewares/authMiddleware');
const dailyTaskController = require('../Controller/dailyTaskController');

// Middleware hỗ trợ token tùy chọn (dành cho GET /api/daily-tasks)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
    }
    if (!token) {
        return next();
    }
    const secretKey = process.env.SECRET_KEY || 'YOUR_SECRET_KEY';
    jwt.verify(token, secretKey, (err, decoded) => {
        if (!err && decoded) {
            req.user = decoded;
        }
        next();
    });
};

// 1. GET /api/daily-tasks - Lấy trạng thái danh sách nhiệm vụ hôm nay
router.get('/', optionalAuth, dailyTaskController.getDailyTasks);

// 2. POST /api/daily-tasks/check-in - Điểm danh / ghi nhận đăng nhập
router.post('/check-in', authenticateToken, dailyTaskController.checkIn);

// 3. POST /api/daily-tasks/product-view - Ghi nhận xem chi tiết sản phẩm
router.post('/product-view', authenticateToken, dailyTaskController.recordProductViewAction);

// 4. POST /api/daily-tasks/community-explore - Ghi nhận truy cập cộng đồng
router.post('/community-explore', authenticateToken, dailyTaskController.recordCommunityExploreAction);

// 5. POST /api/daily-tasks/event-share - Ghi nhận chia sẻ sự kiện
router.post('/event-share', authenticateToken, dailyTaskController.recordEventShareAction);

// 6. POST /api/daily-tasks/:taskId/claim - Nhận thưởng nhiệm vụ
router.post('/:taskId/claim', authenticateToken, dailyTaskController.claimTask);

// 7. GET /api/daily-tasks/seed-inventory - Lấy kho hạt giống của user
router.get('/seed-inventory', optionalAuth, dailyTaskController.getSeedInventory);

// 8. POST /api/daily-tasks/seed-inventory/consume - Sử dụng 1 hạt giống để trồng
router.post('/seed-inventory/consume', authenticateToken, dailyTaskController.consumeSeedAction);

module.exports = router;
