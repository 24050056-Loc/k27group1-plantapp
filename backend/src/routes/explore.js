const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middlewares/authMiddleware');
const { recordPostLike } = require('../Controller/dailyTaskController');

// =========================================================================
// CẤU HÌNH MULTER LƯU ẢNH TRỰC TIẾP TRÊN SERVER LOCAL (uploads/posts)
// =========================================================================
const POSTS_UPLOAD_DIR = path.join(__dirname, '../../uploads/posts');
if (!fs.existsSync(POSTS_UPLOAD_DIR)) {
    fs.mkdirSync(POSTS_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, POSTS_UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const userId = req.user?.id || 'anon';
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
        cb(null, `post_${userId}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMime.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh (jpg, jpeg, png, webp)'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB/ảnh
    fileFilter: fileFilter
});

// Helper chuẩn hóa URL hình ảnh (loại bỏ localhost, ghép baseUrl truy cập được từ Mobile LAN)
function resolveImageUrl(req, urlOrPath) {
    if (!urlOrPath) return null;
    const trimmed = String(urlOrPath).trim();
    if (!trimmed) return null;

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || '192.168.190.239:8080';

    // Nếu là đường dẫn tương đối của uploads
    if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
        const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return `${protocol}://${host}${cleanPath}`;
    }

    // Nếu chứa localhost hoặc 127.0.0.1, thay bằng host thực tế hiện tại
    if (trimmed.includes('localhost:') || trimmed.includes('127.0.0.1:')) {
        return trimmed.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, `${protocol}://${host}`);
    }

    return trimmed;
}

// Helper lấy user ID hiện tại từ Authorization header nếu có (không bắt buộc đăng nhập để xem)
function getOptionalUserId(req) {
    try {
        const authHeader = req.headers['authorization'];
        let token = authHeader && authHeader.split(' ')[1];
        if (token && token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1);
        }
        if (!token) {
            return req.query.user_id ? parseInt(req.query.user_id) : 0;
        }
        const secretKey = process.env.SECRET_KEY || 'YOUR_SECRET_KEY';
        const decoded = jwt.verify(token, secretKey);
        return decoded?.id || 0;
    } catch {
        return req.query.user_id ? parseInt(req.query.user_id) : 0;
    }
}

// Helper tính khoảng thời gian đăng bài (VD: "2 giờ trước", "5 phút trước")
function formatTimeAgo(dateStr) {
    if (!dateStr) return 'Vừa xong';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 172800) return 'Hôm qua';
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

// =========================================================================
// KHỞI TẠO BẢNG TỰ ĐỘNG NẾU CHƯA TỒN TẠI (AUTO TABLE MIGRATION)
// =========================================================================
async function initExploreTables() {
    try {
        // Tự động bổ sung cột avatar vào bảng users nếu chưa có
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL`);
        } catch {}

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
                parent_id INT NULL DEFAULT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Thêm cột parent_id cho explore_comments nếu chưa có
        try {
            await pool.query(`ALTER TABLE explore_comments ADD COLUMN parent_id INT NULL DEFAULT NULL`);
        } catch {}

    } catch (err) {
        console.error("❌ Lỗi khởi tạo bảng Khám Phá:", err.message);
    }
}

const initPromise = initExploreTables();

// Danh mục tab Khám Phá
const CATEGORIES = [
    { id: 'tat_ca', name: 'Tất cả' },
    { id: 'danh_gia_hot', name: 'Đánh giá hot' },
    { id: 'khoe_cay', name: 'Khoe cây 🌿' },
    { id: 'meo_cham_cay', name: 'Mẹo chăm sóc' }
];

const TAG_MAP = {
    'danh_gia_hot': 'Đánh giá hot',
    'khoe_cay': 'Khoe cây 🌿',
    'meo_cham_cay': 'Mẹo chăm sóc'
};

// =========================================================================
// CÁC ROUTE API DÀNH CHO KHÁM PHÁ (EXPLORE)
// =========================================================================

/**
 * 1. GET /explore/categories
 */
router.get('/categories', (req, res) => {
    res.json({
        success: true,
        data: CATEGORIES
    });
});

/**
 * 2. GET /explore/posts
 * Lấy danh sách bài viết từ MySQL kèm thông tin User thật & like state
 */
router.get('/posts', async (req, res) => {
    await initPromise;
    try {
        const { category, search, page = 1, limit = 20 } = req.query;
        const currentUserId = getOptionalUserId(req);
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

        let whereConditions = [];
        let queryParams = [];

        // Lọc theo category
        if (category && category !== 'tat_ca' && category !== 'Tất cả') {
            let catSlug = category;
            if (category === 'Đánh giá hot') catSlug = 'danh_gia_hot';
            else if (category === 'Khoe cây 🌿' || category === 'khoe_cay') catSlug = 'khoe_cay';
            else if (category === 'Mẹo chăm cây' || category === 'Mẹo chăm sóc' || category === 'meo_cham_cay') catSlug = 'meo_cham_cay';

            whereConditions.push('p.category_tag = ?');
            queryParams.push(catSlug);
        }

        // Lọc theo từ khóa tìm kiếm
        if (search && search.trim() !== '') {
            whereConditions.push('(p.content LIKE ? OR p.plant_name LIKE ?)');
            const searchPattern = `%${search.trim()}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

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

        // Format chuẩn cho Frontend
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

            // Chuẩn hóa URL cho từng ảnh bài viết
            const resolvedImages = (Array.isArray(parsedImages) ? parsedImages : [])
                .map(img => resolveImageUrl(req, img))
                .filter(Boolean);

            return {
                id: post.id,
                user_id: post.user_id,
                author_name: post.author_name,
                author_avatar: resolveImageUrl(req, post.author_avatar),
                da_mua_hang: Boolean(post.da_mua_hang),
                category_tag: TAG_MAP[post.category_tag] || post.category_tag || 'Khám phá',
                plant_name: post.plant_name,
                rating: post.rating || 5,
                content: post.content,
                images: resolvedImages,
                media: resolvedImages.map((url, idx) => ({
                    id: idx + 1,
                    review_id: post.id,
                    loai_media: 'hinh_anh',
                    media_url: url
                })),
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
        console.error("❌ Lỗi lấy danh sách bài viết Khám Phá:", error);
        res.status(500).json({ success: false, message: "Lỗi kết nối cơ sở dữ liệu", error: error.message });
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
        const currentUserId = getOptionalUserId(req);

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
        } catch {
            parsedImages = post.images ? [post.images] : [];
        }

        const resolvedImages = (Array.isArray(parsedImages) ? parsedImages : [])
            .map(img => resolveImageUrl(req, img))
            .filter(Boolean);

        const formattedPost = {
            id: post.id,
            user_id: post.user_id,
            author_name: post.author_name,
            author_avatar: resolveImageUrl(req, post.author_avatar),
            da_mua_hang: Boolean(post.da_mua_hang),
            category_tag: TAG_MAP[post.category_tag] || post.category_tag || 'Khám phá',
            plant_name: post.plant_name,
            rating: post.rating || 5,
            content: post.content,
            images: resolvedImages,
            media: resolvedImages.map((url, idx) => ({
                id: idx + 1,
                review_id: post.id,
                loai_media: 'hinh_anh',
                media_url: url
            })),
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            is_liked: Boolean(post.is_liked),
            created_at: post.created_at,
            created_at_formatted: formatTimeAgo(post.created_at)
        };

        res.json({ success: true, data: formattedPost });
    } catch (error) {
        console.error("❌ Lỗi lấy chi tiết bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 4. POST /explore/posts (Tạo bài viết mới kèm upload ảnh bằng Multer, Bắt buộc JWT)
 */
const postHandler = async (req, res) => {
    await initPromise;
    try {
        const userId = req.user.id;
        const { category_tag, plant_name, rating, content, noi_dung, so_sao } = req.body;

        const finalContent = content || noi_dung;
        const finalRating = rating || so_sao || 5;

        if (!finalContent || !finalContent.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung bài viết" });
        }

        // Xử lý các file đã được Multer lưu vào backend/uploads/posts
        let uploadedImages = [];
        if (req.files && req.files.length > 0) {
            uploadedImages = req.files.map(file => `/uploads/posts/${file.filename}`);
        } else if (req.file) {
            uploadedImages = [`/uploads/posts/${req.file.filename}`];
        }

        // Nếu client có truyền mảng ảnh có sẵn (ví dụ url)
        if (req.body.images) {
            try {
                const extraImgs = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
                if (Array.isArray(extraImgs)) {
                    uploadedImages.push(...extraImgs);
                }
            } catch {}
        }

        let categoryTag = 'khoe_cay';
        if (category_tag === 'Đánh giá hot' || category_tag === 'danh_gia_hot') categoryTag = 'danh_gia_hot';
        else if (category_tag === 'Mẹo chăm cây' || category_tag === 'Mẹo chăm sóc' || category_tag === 'meo_cham_cay') categoryTag = 'meo_cham_cay';
        else if (category_tag === 'Khoe cây 🌿' || category_tag === 'khoe_cay') categoryTag = 'khoe_cay';

        const insertSql = `
            INSERT INTO explore_posts 
            (user_id, category_tag, plant_name, rating, content, images, da_mua_hang) 
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;

        const [result] = await pool.query(insertSql, [
            userId,
            categoryTag,
            plant_name || null,
            parseInt(finalRating),
            finalContent.trim(),
            JSON.stringify(uploadedImages)
        ]);

        const newPostId = result.insertId;

        // Lấy thông tin user đăng bài để trả về ngay cho Frontend
        const [userRows] = await pool.query('SELECT id, ho_ten, ten_dang_nhap, avatar FROM users WHERE id = ?', [userId]);
        const author = userRows[0] || {};
        const authorName = author.ho_ten || author.ten_dang_nhap || 'Bạn';
        const authorAvatar = resolveImageUrl(req, author.avatar);

        const resolvedImages = uploadedImages.map(img => resolveImageUrl(req, img));

        const responsePost = {
            id: newPostId,
            user_id: userId,
            author_name: authorName,
            author_avatar: authorAvatar,
            da_mua_hang: true,
            category_tag: TAG_MAP[categoryTag] || 'Khám phá',
            plant_name: plant_name || null,
            rating: parseInt(finalRating),
            content: finalContent.trim(),
            images: resolvedImages,
            media: resolvedImages.map((url, idx) => ({
                id: idx + 1,
                review_id: newPostId,
                loai_media: 'hinh_anh',
                media_url: url
            })),
            likes_count: 0,
            comments_count: 0,
            is_liked: false,
            created_at: new Date().toISOString(),
            created_at_formatted: 'Vừa xong'
        };

        res.json({
            success: true,
            message: "Đăng bài viết thành công!",
            data: responsePost
        });

    } catch (error) {
        console.error("❌ Lỗi đăng bài Khám Phá:", error);
        res.status(500).json({ success: false, message: "Lỗi đăng bài viết", error: error.message });
    }
};

router.post('/posts', authenticateToken, upload.array('photos', 5), postHandler);
router.post('/', authenticateToken, upload.array('photos', 5), postHandler);

/**
 * 5. POST /explore/posts/:id/like (Bắt buộc JWT)
 * Toggle Like/Unlike
 */
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Kiểm tra bài viết có tồn tại không
        const [postExists] = await pool.query('SELECT id FROM explore_posts WHERE id = ?', [id]);
        if (postExists.length === 0) {
            return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });
        }

        // Kiểm tra xem đã like chưa
        const [checkRows] = await pool.query(
            'SELECT id FROM explore_likes WHERE post_id = ? AND user_id = ?',
            [id, userId]
        );

        let isLiked = false;
        if (checkRows.length > 0) {
            // Đã thích -> Bỏ thích
            await pool.query('DELETE FROM explore_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
            await pool.query('UPDATE explore_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [id]);
            isLiked = false;
        } else {
            // Chưa thích -> Thêm lượt thích
            await pool.query('INSERT INTO explore_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
            await pool.query('UPDATE explore_posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);
            isLiked = true;
            // Ghi nhận nhiệm vụ hàng ngày: Tim 1 bài viết bất kỳ
            await recordPostLike(userId, id);
        }

        // Lấy lại số like mới nhất
        const [postRows] = await pool.query('SELECT likes_count FROM explore_posts WHERE id = ?', [id]);
        const likesCount = postRows.length > 0 ? postRows[0].likes_count : 0;

        res.json({
            success: true,
            is_liked: isLiked,
            likes_count: likesCount,
            total_likes: likesCount,
            message: isLiked ? "Đã thích bài viết" : "Đã bỏ thích bài viết"
        });

    } catch (error) {
        console.error("❌ Lỗi toggle like bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 6. GET /explore/posts/:id/comments
 * Lấy danh sách bình luận kèm User Avatar và tên thật
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
                c.parent_id,
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

        // Gom các reply lồng nhau nếu có parent_id
        const commentMap = {};
        const rootComments = [];

        rows.forEach(item => {
            const formatted = {
                id: item.id,
                review_id: item.post_id,
                post_id: item.post_id,
                user_id: item.user_id,
                user_name: item.author_name,
                author_name: item.author_name,
                user_avatar: resolveImageUrl(req, item.author_avatar),
                author_avatar: resolveImageUrl(req, item.author_avatar),
                parent_id: item.parent_id,
                noi_dung: item.content,
                content: item.content,
                created_at: formatTimeAgo(item.created_at),
                raw_created_at: item.created_at,
                replies: []
            };
            commentMap[item.id] = formatted;
        });

        rows.forEach(item => {
            if (item.parent_id && commentMap[item.parent_id]) {
                commentMap[item.parent_id].replies.push(commentMap[item.id]);
            } else {
                rootComments.push(commentMap[item.id]);
            }
        });

        res.json({
            success: true,
            data: rootComments
        });
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 7. POST /explore/posts/:id/comments (Bắt buộc JWT)
 * Thêm bình luận mới vào bài viết
 */
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { content, noi_dung, parent_id } = req.body;
        const finalContent = (content || noi_dung || '').trim();

        if (!finalContent) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung bình luận" });
        }

        // Kiểm tra bài viết tồn tại
        const [postExists] = await pool.query('SELECT id FROM explore_posts WHERE id = ?', [id]);
        if (postExists.length === 0) {
            return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });
        }

        const insertSql = 'INSERT INTO explore_comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(insertSql, [id, userId, parent_id || null, finalContent]);

        // Cập nhật số lượng bình luận bài viết
        await pool.query('UPDATE explore_posts SET comments_count = comments_count + 1 WHERE id = ?', [id]);

        // Lấy thông tin người bình luận
        const [userRows] = await pool.query('SELECT id, ho_ten, ten_dang_nhap, avatar FROM users WHERE id = ?', [userId]);
        const user = userRows[0] || {};
        const authorName = user.ho_ten || user.ten_dang_nhap || 'Bạn';
        const authorAvatar = resolveImageUrl(req, user.avatar);

        const newComment = {
            id: result.insertId,
            review_id: parseInt(id),
            post_id: parseInt(id),
            user_id: userId,
            user_name: authorName,
            author_name: authorName,
            user_avatar: authorAvatar,
            author_avatar: authorAvatar,
            parent_id: parent_id || null,
            noi_dung: finalContent,
            content: finalContent,
            created_at: 'Vừa xong',
            replies: []
        };

        res.json({
            success: true,
            message: "Bình luận thành công!",
            data: newComment
        });
    } catch (error) {
        console.error("❌ Lỗi thêm bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

/**
 * 8. DELETE /explore/posts/:id (Bắt buộc JWT - Chủ bài viết hoặc Admin)
 */
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    await initPromise;
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.vai_tro === 'admin' || req.user.role === 'admin';

        const [postRows] = await pool.query('SELECT user_id FROM explore_posts WHERE id = ?', [id]);
        if (postRows.length === 0) {
            return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });
        }

        if (postRows[0].user_id !== userId && !isAdmin) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bài viết này" });
        }

        // Xóa bình luận & lượt thích liên quan
        await pool.query('DELETE FROM explore_comments WHERE post_id = ?', [id]);
        await pool.query('DELETE FROM explore_likes WHERE post_id = ?', [id]);
        await pool.query('DELETE FROM explore_posts WHERE id = ?', [id]);

        res.json({ success: true, message: "Đã xóa bài viết thành công" });
    } catch (error) {
        console.error("❌ Lỗi xóa bài viết:", error);
        res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
    }
});

module.exports = router;
