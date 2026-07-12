const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Loi lay danh sach ma giam gia:', error);
        res.status(500).json({ success: false, message: 'Loi lay danh sach ma giam gia' });
    }
});

router.get('/code/:ma_code', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM coupons WHERE ma_code = ? AND dang_ap_dung = TRUE',
            [req.params.ma_code]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ma giam gia khong hop le hoac da het ap dung' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Loi kiem tra ma giam gia:', error);
        res.status(500).json({ success: false, message: 'Loi kiem tra ma giam gia' });
    }
});

router.post('/validate', async (req, res) => {
    try {
        const { ma_code, tong_tien_hang = 0 } = req.body;
        if (!ma_code) {
            return res.status(400).json({ success: false, message: 'Vui long nhap ma giam gia' });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM coupons WHERE ma_code = ? AND dang_ap_dung = TRUE',
            [ma_code]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ma giam gia khong hop le hoac da het ap dung' });
        }

        const coupon = rows[0];
        const total = Number(tong_tien_hang) || 0;
        const discount = coupon.loai_giam_gia === 'phan_tram'
            ? Math.min(total, total * (Number(coupon.gia_tri_giam) / 100))
            : Math.min(total, Number(coupon.gia_tri_giam));

        res.json({
            success: true,
            data: coupon,
            so_tien_giam_gia: discount,
            tong_thanh_toan: Math.max(0, total - discount)
        });
    } catch (error) {
        console.error('Loi kiem tra ma giam gia:', error);
        res.status(500).json({ success: false, message: 'Loi kiem tra ma giam gia' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Khong tim thay ma giam gia' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Loi lay ma giam gia:', error);
        res.status(500).json({ success: false, message: 'Loi lay ma giam gia' });
    }
});

modules.exports = router;