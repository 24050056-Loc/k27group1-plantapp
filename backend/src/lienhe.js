const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { ho_ten, email, chu_de, noi_dung } = req.body;

        if (!ho_ten || !email || !noi_dung) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đủ thông tin" });
        }

        // Hiện tại chỉ in ra terminal để kiểm tra
        console.log(`[CONTACT] Từ ${ho_ten} - Chủ đề: ${chu_de} - Nội dung: ${noi_dung}`);

        res.json({ success: true, message: "Đã nhận được liên hệ!" });
    } catch (error) {
        console.error("Lỗi gửi liên hệ:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;