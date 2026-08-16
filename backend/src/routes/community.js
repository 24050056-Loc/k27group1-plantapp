const express = require('express');
const router = express.Router();
const pool = require('../db');
// TRANG BÌNH LUẬN
// 1. API Lấy danh sách tất cả bài viết (Kèm thông tin người đăng)
router.get('/posts', async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.ho_ten, u.ten_dang_nhap 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `;
        const [rows] = await pool.execute(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Lỗi lấy bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 2. API Tạo bài viết / câu hỏi mới
router.post('/posts', async (req, res) => {
    const { user_id, title, content, image_url } = req.body;

    if (!user_id || !title || !content) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    try {
        const query = `INSERT INTO posts (user_id, title, content, image_url) VALUES (?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [user_id, title, content, image_url || null]);
        res.json({ success: true, message: "Đăng bài thành công!", postId: result.insertId });
    } catch (error) {
        console.error("Lỗi đăng bài:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 3. API Lấy danh sách bình luận của 1 bài viết cụ thể
router.get('/posts/:id/comments', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.*, u.ho_ten, u.ten_dang_nhap 
            FROM post_comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.post_id = ? 
            ORDER BY c.created_at ASC
        `;
        const [rows] = await pool.execute(query, [id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Lỗi lấy bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 4. API Thêm bình luận vào bài viết
router.post('/posts/:id/comments', async (req, res) => {
    const { id } = req.params; // post_id
    const { user_id, comment } = req.body;

    if (!user_id || !comment) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin người dùng hoặc nội dung" });
    }

    try {
        const query = `INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)`;
        await pool.execute(query, [id, user_id, comment]);
        res.json({ success: true, message: "Bình luận thành công!" });
    } catch (error) {
        console.error("Lỗi bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

module.exports = router;
