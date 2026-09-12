const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middlewares/authMiddleware');

const SHIPPING_FEE = 30000;
const COUPON_EXPIRY_DAYS = 7;

let tableInitialized = false;

const ensureUserCouponsTable = async () => {
    if (tableInitialized) return;
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS user_coupons (
                id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                code VARCHAR(40) NOT NULL,
                label VARCHAR(255) NOT NULL,
                description VARCHAR(255) DEFAULT NULL,
                discount_type ENUM('phan_tram', 'so_tien_co_dinh') NOT NULL DEFAULT 'phan_tram',
                discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
                source_stage INT DEFAULT NULL,
                status ENUM('available', 'used', 'expired') NOT NULL DEFAULT 'available',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                used_at DATETIME NULL,
                PRIMARY KEY (id),
                UNIQUE KEY uq_user_coupon_code (code),
                KEY idx_user_coupon_owner (user_id),
                KEY idx_user_coupon_status (status),
                KEY idx_user_coupon_expiry (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Kiểm tra và bổ sung cột an toàn (tương thích mọi phiên bản MySQL)
        const [existingCols] = await pool.query('SHOW COLUMNS FROM user_coupons');
        const colNames = existingCols.map(c => c.Field);

        if (!colNames.includes('label')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN label VARCHAR(255) NOT NULL DEFAULT ''");
        }
        if (!colNames.includes('description')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN description VARCHAR(255) DEFAULT NULL");
        }
        if (!colNames.includes('discount_type')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN discount_type ENUM('phan_tram', 'so_tien_co_dinh') NOT NULL DEFAULT 'phan_tram'");
        }
        if (!colNames.includes('discount_value')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN discount_value DECIMAL(10,2) NOT NULL DEFAULT 0");
        }
        if (!colNames.includes('source_stage')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN source_stage INT DEFAULT NULL");
        }
        if (!colNames.includes('status')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN status ENUM('available', 'used', 'expired') NOT NULL DEFAULT 'available'");
        }
        if (!colNames.includes('created_at')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        }
        if (!colNames.includes('expires_at')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN expires_at DATETIME NOT NULL");
        }
        if (!colNames.includes('used_at')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN used_at DATETIME NULL");
        }
        if (!colNames.includes('used_order_id')) {
            await pool.query("ALTER TABLE user_coupons ADD COLUMN used_order_id VARCHAR(100) NULL");
        }

        tableInitialized = true;
    } catch (error) {
        console.error('Lỗi khởi tạo bảng user_coupons:', error);
    }
};

const cleanupExpiredUserCoupons = async () => {
    try {
        await pool.execute(`
            DELETE FROM user_coupons
            WHERE status = 'used' OR expires_at < NOW()
        `);
    } catch (error) {
        console.error('Lỗi dọn dẹp user_coupons hết hạn:', error);
    }
};

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

const buildUniqueCouponCode = (prefix = 'PLANT') => {
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const stamp = Date.now().toString(36).toUpperCase();
    return `${prefix}${stamp}${randomPart}`.slice(0, 20);
};

const computeDiscount = (coupon, total) => {
    const amount = Number(total) || 0;
    if (coupon.loai_giam_gia === 'phan_tram' || coupon.discount_type === 'phan_tram') {
        const percentage = Number(coupon.gia_tri_giam ?? coupon.discount_value ?? 0);
        return Math.min(amount, amount * (percentage / 100));
    }

    const fixed = Number(coupon.gia_tri_giam ?? coupon.discount_value ?? 0);
    return Math.min(amount, fixed);
};

router.get('/', async (req, res) => {
    try {
        await ensureUserCouponsTable();
        await cleanupExpiredUserCoupons();
        const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi lấy danh sách mã giảm giá:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách mã giảm giá' });
    }
});

router.get('/my', optionalAuth, async (req, res) => {
    try {
        await ensureUserCouponsTable();
        await cleanupExpiredUserCoupons();
        const userId = Number(req.user?.id ?? req.query.userId);
        if (!userId) {
            return res.json({ success: true, data: [] });
        }
        const [rows] = await pool.execute(
            `SELECT * FROM user_coupons
             WHERE user_id = ? AND status = 'available' AND expires_at > NOW()
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi lấy danh sách coupon của user:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách coupon của user' });
    }
});

router.post('/claim-event', optionalAuth, async (req, res) => {
    try {
        await ensureUserCouponsTable();
        const userId = Number(req.user?.id ?? req.body.userId);
        const { stage, label, description, discountType, discountValue } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu userId' });
        }

        const uniqueCode = buildUniqueCouponCode('PLANT');
        const nextExpiresAt = new Date(Date.now() + COUPON_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const discountTypeFinal = discountType === 'so_tien_co_dinh' ? 'so_tien_co_dinh' : 'phan_tram';
        const discountValueFinal = Number(discountValue ?? 10);
        const couponLabel = label || 'Voucher sự kiện';

        const [result] = await pool.execute(
            `INSERT INTO user_coupons
                (user_id, code, label, description, discount_type, discount_value, source_stage, status, created_at, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'available', NOW(), ?)
            `,
            [
                userId,
                uniqueCode,
                couponLabel,
                description || `${couponLabel} dành cho tài khoản của bạn`,
                discountTypeFinal,
                discountValueFinal,
                stage ?? null,
                nextExpiresAt.toISOString().slice(0, 19).replace('T', ' '),
            ]
        );

        res.json({
            success: true,
            data: {
                id: result.insertId,
                user_id: userId,
                code: uniqueCode,
                label: couponLabel,
                description: description || `${couponLabel} dành cho tài khoản của bạn`,
                discount_type: discountTypeFinal,
                discount_value: discountValueFinal,
                source_stage: stage ?? null,
                expires_at: nextExpiresAt.toISOString(),
                status: 'available',
            }
        });
    } catch (error) {
        console.error('Lỗi tạo coupon user:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo coupon user' });
    }
});

router.get('/code/:ma_code', async (req, res) => {
    try {
        await ensureUserCouponsTable();
        await cleanupExpiredUserCoupons();
        const [rows] = await pool.execute(
            'SELECT * FROM coupons WHERE ma_code = ? AND dang_ap_dung = TRUE',
            [req.params.ma_code]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Lỗi kiểm tra mã giảm giá:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra mã giảm giá' });
    }
});

router.post('/validate', optionalAuth, async (req, res) => {
    try {
        await ensureUserCouponsTable();
        await cleanupExpiredUserCoupons();

        const { ma_code, tong_tien_hang = 0 } = req.body;
        const userId = Number(req.user?.id ?? req.body.userId);

        if (!ma_code) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
        }

        const normalizedCode = String(ma_code).trim().toUpperCase();
        const personalCouponQuery = userId
            ? 'SELECT * FROM user_coupons WHERE user_id = ? AND code = ? AND status = "available" AND expires_at > NOW() LIMIT 1'
            : null;

        if (personalCouponQuery) {
            const [personalRows] = await pool.execute(personalCouponQuery, [userId, normalizedCode]);
            if (personalRows.length > 0) {
                const coupon = personalRows[0];
                const total = Number(tong_tien_hang) || 0;
                const discount = computeDiscount(coupon, total);
                return res.json({
                    success: true,
                    data: {
                        id: coupon.id,
                        user_coupon_id: coupon.id, // ID dùng để mark khi checkout
                        ma_code: coupon.code,
                        loai_giam_gia: coupon.discount_type,
                        gia_tri_giam: coupon.discount_value,
                        mo_ta: coupon.description,
                    },
                    so_tien_giam_gia: discount,
                    phi_van_chuyen: SHIPPING_FEE,
                    tong_thanh_toan: Math.max(0, total - discount + SHIPPING_FEE)
                });
            }
        }

        const [rows] = await pool.execute(
            'SELECT * FROM coupons WHERE ma_code = ? AND dang_ap_dung = TRUE',
            [normalizedCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
        }

        const coupon = rows[0];
        const total = Number(tong_tien_hang) || 0;
        const discount = computeDiscount(coupon, total);

        res.json({
            success: true,
            data: coupon,
            so_tien_giam_gia: discount,
            phi_van_chuyen: SHIPPING_FEE,
            tong_thanh_toan: Math.max(0, total - discount + SHIPPING_FEE)
        });
    } catch (error) {
        console.error('Lỗi kiểm tra mã giảm giá:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra mã giảm giá' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Lỗi lấy mã giảm giá:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy mã giảm giá' });
    }
});

module.exports = router;
