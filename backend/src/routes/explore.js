const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer setup cho upload ảnh
const upload = multer({ dest: 'uploads/' });

// Thử require ggdrive helper nếu có
let uploadFileToDrive = null;
try {
    const ggdrive = require('../../ggdrive.js');
    uploadFileToDrive = ggdrive.uploadFileToDrive;
} catch (e) {
    console.log("ℹ️ ggdrive helper chưa sẵn sàng hoặc không tìm thấy:", e.message);
}

// =========================================================================
// KHỞI TẠO BẢNG TỰ ĐỘNG NẾU CHƯA TỒN TẠI (AUTO TABLE MIGRATION & SEED)
// =========================================================================
async function initExploreTables() {
    try {
        // Tự động bổ sung cột avatar vào bảng users nếu chưa có
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL`);
        } catch (e) {
            // Cột avatar đã tồn tại, bỏ qua lỗi
        }

        // Bảng Bài viết Khám Phá
        await pool.query(`
            CREATE TABLE IF NOT EXISTS explore_posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category_tag VARCHAR(50) NOT NULL DEFAULT 'khoe_cay',
                plant_name VARCHAR(255) NULL,
                rating TINYINT DEFAULT 5,
                content TEXT NOT NULL,
                images JSON NULL,
                likes_count INT DEFAULT 0,
                comments_count INT DEFAULT 0,
                da_mua_hang BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Bảng Lượt thích
        await pool.query(`
            CREATE TABLE IF NOT EXISTS explore_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_post_like (post_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Bảng Bình luận
        await pool.query(`
            CREATE TABLE IF NOT EXISTS explore_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Kiểm tra xem bảng explore_posts đã có dữ liệu chưa, nếu chưa thì chèn dữ liệu mẫu
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM explore_posts');
        if (rows[0].count === 0) {
            console.log("🌱 Đang khởi tạo dữ liệu mẫu cho trang Khám Phá...");
            const samplePosts = [
                [
                    1,
                    'danh_gia_hot',
                    'Sen Đá Ngọc Bích (Jade Plant)',
                    5,
                    'Cây nhận được tươi xanh và mộng nước lắm mọi người ơi! Đóng gói cực kỳ cẩn thận, có kèm cả hướng dẫn tưới nước nữa. Sẽ tiếp tục ủng hộ shop...',
                    JSON.stringify([
                        'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80',
                        'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80'
                    ]),
                    24,
                    3,
                    1
                ],
                [
                    1,
                    'khoe_cay',
                    'Cây Bàng Đài Loan',
                    5,
                    'Góc ban công xanh mát vừa được trang hoàng thêm cây bàng lá nhỏ. Cây khỏe, phát triển rất nhanh luôn nha mọi người!',
                    JSON.stringify([
                        'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80'
                    ]),
                    45,
                    8,
                    1
                ],
                [
                    1,
                    'meo_cham_cay',
                    'Lưỡi Hổ Thái',
                    5,
                    'Mẹo nhỏ cho các bạn mới trồng Lưỡi Hổ: Không nên tưới quá nhiều nước, 1-2 tuần tưới 1 lần là cây sống rất khỏe và lọc không khí cực tốt nha!',
                    JSON.stringify([
                        'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80'
                    ]),
                    89,
                    12,
                    0
                ]
            ];

            const insertSql = `
                INSERT INTO explore_posts 
                (user_id, category_tag, plant_name, rating, content, images, likes_count, comments_count, da_mua_hang) 
                VALUES ?
            `;
            await pool.query(insertSql, [samplePosts]);
            console.log("✅ Đã tạo dữ liệu mẫu thành công cho Khám Phá!");
        }
    } catch (err) {
        console.error("❌ Lỗi khởi tạo bảng Khám Phá (explore):", err.message);
    }
}

// Gọi khởi tạo bảng khi nạp file
const initPromise = initExploreTables();

// Helper tính khoảng thời gian đăng bài (VD: "2 giờ trước", "5 phút trước")
function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

// Danh mục tab Khám Phá
const CATEGORIES = [
    { id: 'tat_ca', name: 'Tất cả' },
    { id: 'danh_gia_hot', name: 'Đánh giá hot' },
    { id: 'khoe_cay', name: 'Khoe cây 🌿' },
    { id: 'meo_cham_cay', name: 'Mẹo chăm cây' }
];

// Map tên hiển thị tag
const TAG_MAP = {
    'danh_gia_hot': 'Đánh giá hot',
    'khoe_cay': 'Khoe cây 🌿',
    'meo_cham_cay': 'Mẹo chăm cây'
};

// =========================================================================
// CÁC ROUTE API DÀNH CHO KHÁM PHÁ (EXPLORE)
// =========================================================================

/**
 * 1. GET /explore/categories
 * Lấy danh sách các tab/danh mục lọc bài viết trên trang Khám phá
 */
router.get('/categories', (req, res) => {
    res.json({
        success: true,
        data: CATEGORIES
    });
});

/**
 * 2. GET /explore/posts
 * Lấy danh sách tất cả bài viết khám phá (Có lọc theo danh mục, từ khóa tìm kiếm)
 * Query params: category, search, user_id, page, limit
 */
router.get('/posts', async (req, res) => {
    await initPromise;
    try {
        const { category, search, user_id, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];
        let queryParams = [];

        // Lọc theo category
        if (category && category !== 'tat_ca') {
            whereConditions.push('p.category_tag = ?');
            queryParams.push(category);
        }

        // Lọc theo từ khóa tìm kiếm
        if (search && search.trim() !== '') {
            whereConditions.push('(p.content LIKE ? OR p.plant_name LIKE ?)');
            const searchPattern = `%${search.trim()}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Query lấy danh sách bài viết kèm thông tin người dùng và trạng thái like
        const currentUserId = user_id ? parseInt(user_id) : 0;
        const sql = `
            SELECT 
                p.id,
                p.user_id,
                COALESCE(u.ho_ten, u.ten_dang_nhap, 'Người dùng') AS author_name,
                u.avatar AS author_avatar,
                p.da_mua_hang,
                p.category_tag,
                p.plant_name,
                p.rating,
                p.content,
                p.images,
                p.likes_count,
                p.comments_count,
                p.created_at,
                (EXISTS (
                    SELECT 1 FROM explore_likes l 
                    WHERE l.post_id = p.id AND l.user_id = ?
                )) AS is_liked
            FROM explore_posts p
            LEFT JOIN users u ON p.user_id = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const finalParams = [currentUserId, ...queryParams, parseInt(limit), offset];
        const [rows] = await pool.query(sql, finalParams);

        // Format lại dữ liệu trả về cho chuẩn FE
        const formattedData = rows.map(post => {
            let parsedImages = [];
            try {
                if (typeof post.images === 'string') {
                    parsedImages = JSON.parse(post.images);
                } else if (Array.isArray(post.images)) {
                    parsedImages = post.images;
                }
            } catch (e) {
                parsedImages = post.images ? [post.images] : [];
            }

            return {
                id: post.id,
                user_id: post.user_id,
                author_name: post.author_name,
                author_avatar: post.author_avatar || null,
                da_mua_hang: Boolean(post.da_mua_hang),
                category_tag: post.category_tag,
                category_label: TAG_MAP[post.category_tag] || 'Bài viết',
                plant_name: post.plant_name,
                rating: post.rating || 5,
                content: post.content,
                images: parsedImages,
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                is_liked: Boolean(post.is_liked),
                created_at: post.created_at,
                created_at_formatted: formatTimeAgo(post.created_at)
            };
        });

        res.json({
            success: true,
            data: formattedData,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách bài viết Khám Phá:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 3. GET /explore/posts/:id
 * Lấy chi tiết 1 bài viết Khám Phá
 */
router.get('/posts/:id', async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const { user_id } = req.query;
        const currentUserId = user_id ? parseInt(user_id) : 0;

        const sql = `
            SELECT 
                p.id,
                p.user_id,
                COALESCE(u.ho_ten, u.ten_dang_nhap, 'Người dùng') AS author_name,
                u.avatar AS author_avatar,
                p.da_mua_hang,
                p.category_tag,
                p.plant_name,
                p.rating,
                p.content,
                p.images,
                p.likes_count,
                p.comments_count,
                p.created_at,
                (EXISTS (
                    SELECT 1 FROM explore_likes l 
                    WHERE l.post_id = p.id AND l.user_id = ?
                )) AS is_liked
            FROM explore_posts p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `;

        const [rows] = await pool.query(sql, [currentUserId, id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        const post = rows[0];
        let parsedImages = [];
        try {
            if (typeof post.images === 'string') {
                parsedImages = JSON.parse(post.images);
            } else if (Array.isArray(post.images)) {
                parsedImages = post.images;
            }
        } catch (e) {
            parsedImages = post.images ? [post.images] : [];
        }

        const formattedPost = {
            id: post.id,
            user_id: post.user_id,
            author_name: post.author_name,
            author_avatar: post.author_avatar || null,
            da_mua_hang: Boolean(post.da_mua_hang),
            category_tag: post.category_tag,
            category_label: TAG_MAP[post.category_tag] || 'Bài viết',
            plant_name: post.plant_name,
            rating: post.rating || 5,
            content: post.content,
            images: parsedImages,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            is_liked: Boolean(post.is_liked),
            created_at: post.created_at,
            created_at_formatted: formatTimeAgo(post.created_at)
        };

        res.json({ success: true, data: formattedPost });
    } catch (error) {
        console.error("Lỗi lấy chi tiết bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

const postHandler = async (req, res) => {
    await initPromise;
    try {
        const { user_id, category_tag, plant_name, rating, content, image_urls, noi_dung, so_sao } = req.body;

        const finalUserId = user_id || req.body.userId || 1;
        const finalContent = content || noi_dung;
        const finalRating = rating || so_sao || 5;

        if (!finalContent || !finalContent.trim()) {
            return res.status(400).json({ success: false, message: "Thiếu nội dung bài viết" });
        }

        let uploadedImages = [];

        // Nếu gửi sẵn link ảnh dạng chuỗi/mảng JSON
        if (image_urls) {
            try {
                uploadedImages = typeof image_urls === 'string' ? JSON.parse(image_urls) : image_urls;
            } catch (e) {
                uploadedImages = [image_urls];
            }
        }

        // Nếu có upload file từ client
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (uploadFileToDrive) {
                    try {
                        const driveData = await uploadFileToDrive(file.path);
                        if (driveData && driveData.webViewLink) {
                            uploadedImages.push(driveData.webViewLink);
                        }
                    } catch (driveErr) {
                        console.error("Lỗi upload file lên Google Drive:", driveErr.message);
                    }
                }
                // Xóa file tạm
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        let categoryTag = category_tag || 'khoe_cay';
        if (categoryTag === 'Khoe cây 🌿' || categoryTag === 'khoe_cay') categoryTag = 'khoe_cay';
        else if (categoryTag === 'Đánh giá hot' || categoryTag === 'danh_gia_hot') categoryTag = 'danh_gia_hot';
        else if (categoryTag === 'Mẹo chăm cây' || categoryTag === 'Mẹo chăm sóc' || categoryTag === 'meo_cham_cay') categoryTag = 'meo_cham_cay';

        let daMuaHang = true;

        const insertSql = `
            INSERT INTO explore_posts 
            (user_id, category_tag, plant_name, rating, content, images, da_mua_hang) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(insertSql, [
            finalUserId,
            categoryTag,
            plant_name || null,
            parseInt(finalRating),
            finalContent.trim(),
            JSON.stringify(uploadedImages),
            daMuaHang
        ]);

        const newPostId = result.insertId;

        res.json({
            success: true,
            id: newPostId,
            postId: newPostId,
            message: "Đăng bài thành công!",
            images: uploadedImages
        });

    } catch (error) {
        console.error("Lỗi đăng bài Khám Phá:", error);
        if (req.files) {
            req.files.forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
        }
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
};

router.post('/posts', upload.any(), postHandler);
router.post('/', upload.any(), postHandler);

/**
 * 5. POST /explore/posts/:id/like
 * Thích / Bỏ thích bài viết (Toggle Like)
 */
router.post('/posts/:id/like', async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: "Thiếu user_id" });
        }

        // Kiểm tra xem đã thích bài viết chưa
        const [checkRows] = await pool.query(
            'SELECT id FROM explore_likes WHERE post_id = ? AND user_id = ?',
            [id, user_id]
        );

        let isLiked = false;
        if (checkRows.length > 0) {
            // Đã thích -> Bỏ thích
            await pool.query('DELETE FROM explore_likes WHERE post_id = ? AND user_id = ?', [id, user_id]);
            await pool.query('UPDATE explore_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [id]);
            isLiked = false;
        } else {
            // Chưa thích -> Thêm lượt thích
            await pool.query('INSERT INTO explore_likes (post_id, user_id) VALUES (?, ?)', [id, user_id]);
            await pool.query('UPDATE explore_posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);
            isLiked = true;
        }

        // Lấy lượt thích mới nhất
        const [postRows] = await pool.query('SELECT likes_count FROM explore_posts WHERE id = ?', [id]);
        const likesCount = postRows.length > 0 ? postRows[0].likes_count : 0;

        res.json({
            success: true,
            is_liked: isLiked,
            likes_count: likesCount,
            message: isLiked ? "Đã thích bài viết" : "Đã bỏ thích bài viết"
        });

    } catch (error) {
        console.error("Lỗi toggle like bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 6. GET /explore/posts/:id/comments
 * Lấy danh sách bình luận của bài viết
 */
router.get('/posts/:id/comments', async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                c.id,
                c.post_id,
                c.user_id,
                c.content,
                c.created_at,
                COALESCE(u.ho_ten, u.ten_dang_nhap, 'Người dùng') AS author_name,
                u.avatar AS author_avatar
            FROM explore_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `;
        const [rows] = await pool.query(sql, [id]);

        const formattedComments = rows.map(item => ({
            ...item,
            created_at_formatted: formatTimeAgo(item.created_at)
        }));

        res.json({
            success: true,
            data: formattedComments
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 7. POST /explore/posts/:id/comments
 * Thêm bình luận mới vào bài viết
 */
router.post('/posts/:id/comments', async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const { user_id, content } = req.body;

        if (!user_id || !content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Thiếu user_id hoặc nội dung bình luận" });
        }

        const insertSql = 'INSERT INTO explore_comments (post_id, user_id, content) VALUES (?, ?, ?)';
        const [result] = await pool.query(insertSql, [id, user_id, content.trim()]);

        // Cập nhật số lượng bình luận bài viết
        await pool.query('UPDATE explore_posts SET comments_count = comments_count + 1 WHERE id = ?', [id]);

        res.json({
            success: true,
            message: "Bình luận thành công!",
            commentId: result.insertId
        });
    } catch (error) {
        console.error("Lỗi thêm bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 8. DELETE /explore/posts/:id
 * Xóa bài viết
 */
router.delete('/posts/:id', async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: "Thiếu user_id" });
        }

        // Xóa bình luận & lượt thích liên quan
        await pool.query('DELETE FROM explore_comments WHERE post_id = ?', [id]);
        await pool.query('DELETE FROM explore_likes WHERE post_id = ?', [id]);
        await pool.query('DELETE FROM explore_posts WHERE id = ? AND user_id = ?', [id, user_id]);

        res.json({ success: true, message: "Đã xóa bài viết thành công" });
    } catch (error) {
        console.error("Lỗi xóa bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

module.exports = router;
