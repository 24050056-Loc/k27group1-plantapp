const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');


router.get('/', (req, res) => {
    res.json({
        success: true,
        data: { ten_cua_hang: "Vườn Xanh", mo_ta: "Chuyên cung cấp cây giống chuẩn VietGAP." }
    });
});

module.exports = router;