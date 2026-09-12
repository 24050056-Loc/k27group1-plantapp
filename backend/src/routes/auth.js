const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');

const SECRET_KEY = process.env.SECRET_KEY || "cay_canh_bi_mat_123";

// --- API ĐĂNG KÝ ---
router.post('/register', async (req, res) => {
    try {

        const { username, password, email, full_name } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: "Vui lòng nhập đủ: Tài khoản, Mật khẩu và Email!" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL khớp với bảng 'users' của bạn
        const sql = 'INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, vai_tro) VALUES (?, ?, ?, ?, ?)';

        // Mặc định vai trò là 'khach_hang'
        await pool.execute(sql, [username, hashedPassword, email, full_name || null, 'khach_hang']);

        res.status(201).json({ success: true, message: "Đăng ký thành công!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Tên đăng nhập hoặc Email đã tồn tại!" });
        }
        res.status(500).json({ message: "Lỗi: " + error.message });
    }
});

// --- API ĐĂNG NHẬP ---
router.post('/login', async (req, res) => {
    try {

        const { username, password } = req.body;

        // Tìm user theo 'ten_dang_nhap'
        const [rows] = await pool.execute('SELECT * FROM users WHERE ten_dang_nhap = ?', [username]);
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

module.exports = router;