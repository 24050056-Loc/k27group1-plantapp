const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');
const { recordDailyLogin } = require('../Controller/dailyTaskController');

const SECRET_KEY = process.env.SECRET_KEY || "cay_canh_bi_mat_123";

// --- API ĐĂNG KÝ ---
router.post('/register', async (req, res) => {
    try {

        const { username, password, email, full_name, so_dien_thoai } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: "Vui lòng nhập đủ: Tài khoản, Mật khẩu và Email!" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL khớp với bảng 'users' của bạn
        const sql = 'INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, so_dien_thoai, vai_tro) VALUES (?, ?, ?, ?, ?, ?)';

        // Mặc định vai trò là 'khach_hang'
        await pool.execute(sql, [username, hashedPassword, email, full_name || null, so_dien_thoai || null, 'khach_hang']);

        res.status(201).json({ success: true, message: "Đăng ký thành công!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Tên đăng nhập hoặc Email đã tồn tại!" });
        }
        res.status(500).json({ message: "Lỗi: " + error.message });
    }
});

// --- API ĐĂNG NHẬP (Hỗ trợ cả Tên đăng nhập hoặc Email) ---
router.post('/login', async (req, res) => {
    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ tài khoản/email và mật khẩu!" });
        }

        // Tìm user theo 'ten_dang_nhap' HOẶC 'email'
        const [rows] = await pool.execute('SELECT * FROM users WHERE ten_dang_nhap = ? OR email = ?', [username, username]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng!" });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.mat_khau);
        if (!isMatch) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng!" });
        }

        // Kiểm tra tài khoản bị khóa
        if (!user.dang_hoat_dong) {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!" });
        }

        // Cập nhật last_seen = NOW() khi đăng nhập thành công
        await pool.execute('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);

        // Ghi nhận nhiệm vụ hàng ngày: Đăng nhập mỗi ngày
        await recordDailyLogin(user.id);

        // Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, vai_tro: user.vai_tro, role: user.vai_tro },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Trả về thông tin (ẩn mật khẩu)
        const { mat_khau, ...userPublic } = user;
        res.json({
            success: true,
            accessToken: token,
            user: userPublic
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập" });
    }
});

// --- API ĐĂNG NHẬP BẰNG GOOGLE ---
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu Google ID Token để xác thực!" 
            });
        }

        // 1. Xác thực Google ID Token bằng thư viện chính thức google-auth-library
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client();

        const googleClientIds = [
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_ANDROID_CLIENT_ID,
            process.env.GOOGLE_IOS_CLIENT_ID
        ].filter(Boolean);

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: googleClientIds.length > 0 ? googleClientIds : undefined
            });
        } catch (verifyError) {
            console.error("Lỗi xác thực Google ID Token:", verifyError.message);
            return res.status(401).json({
                success: false,
                message: "Google ID Token không hợp lệ hoặc đã hết hạn!"
            });
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub) {
            return res.status(400).json({
                success: false,
                message: "Thông tin xác thực Google không đầy đủ hoặc không hợp lệ!"
            });
        }

        const googleSub = payload.sub;
        const googleEmail = payload.email.toLowerCase().trim();
        const googleName = payload.name || payload.given_name || 'Người dùng Google';
        const googlePicture = payload.picture || null;

        // 2. Tìm kiếm trong Database:
        // TH 1: Tìm theo google_id
        const [usersByGoogle] = await pool.execute('SELECT * FROM users WHERE google_id = ?', [googleSub]);
        let user = usersByGoogle[0];

        // TH 2: Nếu chưa có google_id, tìm theo email để liên kết tài khoản đã có
        if (!user) {
            const [usersByEmail] = await pool.execute('SELECT * FROM users WHERE LOWER(email) = ?', [googleEmail]);
            if (usersByEmail.length > 0) {
                user = usersByEmail[0];
                // Liên kết tài khoản: cập nhật google_id, avatar (nếu chưa có), giữ nguyên vai_tro hiện tại (kể cả admin)
                await pool.execute(
                    'UPDATE users SET google_id = ?, avatar = COALESCE(avatar, ?), last_seen = NOW() WHERE id = ?',
                    [googleSub, googlePicture, user.id]
                );
            }
        }

        // TH 3: Nếu chưa có tài khoản nào, tạo tài khoản mới với vai_tro = 'khach_hang'
        if (!user) {
            const crypto = require('crypto');

            // Tạo username duy nhất từ email
            let baseUsername = googleEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
            if (!baseUsername || baseUsername.length < 3) {
                baseUsername = 'google_user';
            }
            let uniqueUsername = baseUsername;
            let counter = 1;

            while (true) {
                const [existing] = await pool.execute('SELECT id FROM users WHERE ten_dang_nhap = ?', [uniqueUsername]);
                if (existing.length === 0) break;
                uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
                counter++;
                if (counter > 10) {
                    uniqueUsername = `user_${Date.now().toString().slice(-6)}`;
                    break;
                }
            }

            // Tạo hash mật khẩu ngẫu nhiên an toàn (không dùng để login thường, thỏa mãn NOT NULL)
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            // BẮT BUỘC: vai_tro = 'khach_hang', dang_hoat_dong = 1
            const [result] = await pool.execute(
                `INSERT INTO users (ten_dang_nhap, mat_khau, email, google_id, ho_ten, avatar, vai_tro, dang_hoat_dong, last_seen) 
                 VALUES (?, ?, ?, ?, ?, ?, 'khach_hang', 1, NOW())`,
                [uniqueUsername, hashedPassword, googleEmail, googleSub, googleName, googlePicture]
            );

            const [newRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newRows[0];
        }

        // 3. Kiểm tra tài khoản bị khóa (dang_hoat_dong = 0)
        if (!user.dang_hoat_dong) {
            return res.status(403).json({ 
                success: false, 
                message: "Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ quản trị viên!" 
            });
        }

        // 4. Cập nhật last_seen = NOW()
        await pool.execute('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);

        // Ghi nhận nhiệm vụ hàng ngày: Đăng nhập mỗi ngày
        await recordDailyLogin(user.id);

        // 5. Cấp JWT Token của PlantApp (giống Login thường)
        const token = jwt.sign(
            { id: user.id, vai_tro: user.vai_tro, role: user.vai_tro },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // 6. Trả về thông tin thành công (ẩn mật khẩu)
        const { mat_khau, ...userPublic } = user;
        return res.json({
            success: true,
            message: "Đăng nhập Google thành công!",
            accessToken: token,
            user: userPublic
        });

    } catch (error) {
        console.error("Lỗi Google Auth Backend:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi xử lý đăng nhập bằng Google." 
        });
    }
});

module.exports = router;