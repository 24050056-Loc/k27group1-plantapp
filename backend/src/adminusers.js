const express = require('express');
const router = express.Router();
const pool = require('./db');
const { verifyToken, isAdmin } = require('./middlewares/authadmin');

// 1. Lấy danh sách tất cả người dùng
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, ho_ten, email, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
    }
});

// 2. Thêm người dùng mới (Admin tự thêm)
router.post('/add', verifyToken, isAdmin, async (req, res) => {
    const { ho_ten, email, password, role, status } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (ho_ten, email, password, role, status) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [ho_ten, email, hashedPassword, role || 'user', status || 'active']);
        res.status(201).json({ id: result.insertId, message: "Thêm người dùng thành công" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email này đã tồn tại" });
        res.status(500).json({ message: "Lỗi hệ thống khi thêm người dùng" });
    }
});

// 3. Cập nhật thông tin người dùng
router.put('/edit/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { ho_ten, email, password, role, status } = req.body;
    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.execute(
                'UPDATE users SET ho_ten=?, email=?, password=?, role=?, status=? WHERE id=?',
                [ho_ten, email, hashedPassword, role, status, id]
            );
        } else {
            await pool.execute(
                'UPDATE users SET ho_ten=?, email=?, role=?, status=? WHERE id=?',
                [ho_ten, email, role, status, id]
            );
        }
        res.json({ message: "Cập nhật người dùng thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật người dùng" });
    }
});

// 4. Xóa người dùng
router.delete('/delete/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM users WHERE id=?', [req.params.id]);
        res.json({ message: "Đã xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa người dùng" });
    }
});

modules.exports = router;