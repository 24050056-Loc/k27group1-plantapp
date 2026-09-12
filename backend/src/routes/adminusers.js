const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// 1. Lấy danh sách người dùng (Hỗ trợ tìm kiếm, phân trang và bộ lọc)
router.get('/', async (req, res) => {
    try {
        const { search, vai_tro, status, page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;

        let conditions = [];
        let params = [];

        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(ho_ten LIKE ? OR email LIKE ? OR ten_dang_nhap LIKE ? OR so_dien_thoai LIKE ?)');
            params.push(term, term, term, term);
        }

        if (vai_tro && vai_tro !== 'all') {
            conditions.push('vai_tro = ?');
            params.push(vai_tro);
        }

        if (status && status !== 'all') {
            if (status === 'active') {
                conditions.push('dang_hoat_dong = 1');
            } else if (status === 'inactive') {
                conditions.push('dang_hoat_dong = 0');
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT id, ten_dang_nhap, email, ho_ten, so_dien_thoai, dia_chi, vai_tro, dang_hoat_dong, ngay_tao 
            FROM users 
            ${whereClause} 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `;

        const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;

        const [users] = await pool.query(sql, [...params, limitNum, offset]);
        const [[{ total }]] = await pool.query(countSql, params);

        res.json({
            success: true,
            data: users,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách user:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách người dùng", error: error.message });
    }
});

// 2. Thêm người dùng mới
router.post('/add', async (req, res) => {
    const { ten_dang_nhap, mat_khau, email, ho_ten, so_dien_thoai, dia_chi, vai_tro, dang_hoat_dong } = req.body;
    try {
        if (!ten_dang_nhap || !mat_khau || !email) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ Tên đăng nhập, Mật khẩu và Email" });
        }

        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        const role = vai_tro || 'khach_hang';
        const active = dang_hoat_dong === false || dang_hoat_dong === 0 || dang_hoat_dong === '0' ? 0 : 1;

        const query = `
            INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, so_dien_thoai, dia_chi, vai_tro, dang_hoat_dong) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [
            ten_dang_nhap.trim(),
            hashedPassword,
            email.trim(),
            ho_ten ? ho_ten.trim() : null,
            so_dien_thoai ? so_dien_thoai.trim() : null,
            dia_chi ? dia_chi.trim() : null,
            role,
            active
        ]);

        res.status(201).json({ success: true, id: result.insertId, message: "Thêm người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi thêm user:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc Email này đã tồn tại trong hệ thống" });
        }
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thêm người dùng: " + error.message });
    }
});

// 3. Cập nhật thông tin người dùng
router.put('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { ho_ten, email, so_dien_thoai, dia_chi, vai_tro, dang_hoat_dong, mat_khau } = req.body;

    try {
        const active = dang_hoat_dong === false || dang_hoat_dong === 0 || dang_hoat_dong === '0' ? 0 : 1;

        if (mat_khau && mat_khau.trim().length > 0) {
            const hashedPassword = await bcrypt.hash(mat_khau.trim(), 10);
            await pool.execute(
                'UPDATE users SET ho_ten=?, email=?, so_dien_thoai=?, dia_chi=?, vai_tro=?, dang_hoat_dong=?, mat_khau=? WHERE id=?',
                [
                    ho_ten ? ho_ten.trim() : null,
                    email ? email.trim() : null,
                    so_dien_thoai ? so_dien_thoai.trim() : null,
                    dia_chi ? dia_chi.trim() : null,
                    vai_tro || 'khach_hang',
                    active,
                    hashedPassword,
                    id
                ]
            );
        } else {
            await pool.execute(
                'UPDATE users SET ho_ten=?, email=?, so_dien_thoai=?, dia_chi=?, vai_tro=?, dang_hoat_dong=? WHERE id=?',
                [
                    ho_ten ? ho_ten.trim() : null,
                    email ? email.trim() : null,
                    so_dien_thoai ? so_dien_thoai.trim() : null,
                    dia_chi ? dia_chi.trim() : null,
                    vai_tro || 'khach_hang',
                    active,
                    id
                ]
            );
        }

        res.json({ success: true, message: "Cập nhật người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật user:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật người dùng: " + error.message });
    }
});

// 4. Khóa / Mở khóa người dùng (Toggle Status)
router.put('/toggle-status/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('UPDATE users SET dang_hoat_dong = NOT dang_hoat_dong WHERE id = ?', [id]);
        res.json({ success: true, message: "Cập nhật trạng thái người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi toggle status user:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái: " + error.message });
    }
});

// 5. Xóa người dùng
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Không cho phép xóa admin gốc (id = 1)
        if (id == 1) {
            return res.status(400).json({ success: false, message: "Không thể xóa tài khoản Quản trị viên gốc!" });
        }

        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: "Đã xóa người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi xóa user:", error);
        res.status(500).json({ success: false, message: "Lỗi khi xóa người dùng: " + error.message });
    }
});

module.exports = router;