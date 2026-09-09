const express = require('express');
const router = express.Router();
const eventController = require('./Controller/eventController.js');

// ==========================================
// API TRÒ CHƠI TRỒNG CÂY (MINIGAME)
// ==========================================

// 1. Lấy trạng thái cây của người dùng
router.get('/plant-status', eventController.getPlantStatus);

// 2. Tưới nước cho cây
router.post('/water', eventController.waterPlant);

// 3. Thu hoạch cây để nhận voucher
router.post('/harvest', eventController.harvestVoucher);

// 4. Lấy danh sách nhiệm vụ (để nhận thêm nước)
router.get('/missions', eventController.getMissions);

// 5. Hoàn thành nhiệm vụ nhận nước
router.post('/complete-mission', eventController.completeMission);

module.exports = router;
