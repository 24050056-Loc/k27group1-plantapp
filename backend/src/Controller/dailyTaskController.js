const pool = require('../db');

// ─── Timezone & Ngày theo Việt Nam (Asia/Ho_Chi_Minh) ────────────────────────
const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const getVietnamDateStr = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: VN_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    return `${map.year}-${map.month}-${map.day}`;
};

// ─── Khởi tạo các bảng MySQL cho Daily Tasks ─────────────────────────────────
const initDailyTables = (async () => {
    try {
        // 1. Bảng lưu lượt nhận thưởng (Unique chống double-claim trong ngày)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_task_claims (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                task_id VARCHAR(50) NOT NULL,
                task_date DATE NOT NULL,
                reward_type VARCHAR(50) NOT NULL,
                reward_amount INT NOT NULL DEFAULT 1,
                claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_task_date (user_id, task_id, task_date),
                KEY idx_date_task (task_date, task_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Bảng theo dõi đăng nhập mỗi ngày
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_logins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                login_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_login_date (user_id, login_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Bảng theo dõi lượt xem sản phẩm (productId phân biệt)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_product_views (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                view_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_product_date (user_id, product_id, view_date),
                KEY idx_user_view_date (user_id, view_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Bảng theo dõi hành động Like bài viết (Không xóa khi Unlike)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_post_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                post_id INT NOT NULL,
                like_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_post_like_date (user_id, post_id, like_date),
                KEY idx_user_like_date (user_id, like_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Bảng theo dõi chia sẻ sự kiện
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_event_shares (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                share_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_share_date (user_id, share_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Bảng theo dõi khám phá cộng đồng
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_community_explores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                explore_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_explore_date (user_id, explore_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Bảng kho hạt giống người dùng (Persistent User Seed Inventory)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_seed_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                seed_id VARCHAR(100) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_seed (user_id, seed_id),
                KEY idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Khởi tạo thành công các bảng Daily Tasks trong MySQL!');
    } catch (error) {
        console.error('❌ Lỗi khởi tạo bảng Daily Tasks:', error.message);
    }
})();

// ─── Định nghĩa 5 Nhiệm vụ Chuẩn ─────────────────────────────────────────────
const TASK_CONFIGS = {
    daily_login: {
        id: 'daily_login',
        title: 'Đăng nhập mỗi ngày',
        description: 'Phần thưởng: +1 lượt Tưới nước 💧',
        reward: { type: 'water', amount: 1 },
    },
    view_products: {
        id: 'view_products',
        title: 'Xem 3 sản phẩm',
        description: 'Phần thưởng: +1 lượt Tưới nước 💧',
        target: 3,
        reward: { type: 'water', amount: 1 },
    },
    like_post: {
        id: 'like_post',
        title: 'Tim 1 bài viết bất kỳ',
        description: 'Phần thưởng: +1 lượt Bón phân 🌿',
        reward: { type: 'fertilizer', amount: 1 },
    },
    share_event: {
        id: 'share_event',
        title: 'Chia sẻ sự kiện',
        description: 'Phần thưởng: +1 lượt Tưới nước 💧',
        reward: { type: 'water', amount: 1 },
    },
    community_explore: {
        id: 'community_explore',
        title: 'Khám phá cộng đồng',
        description: 'Phần thưởng: +1 hạt giống ngẫu nhiên 🌱',
        reward: { type: 'seed', amount: 1 },
    }
};

const SEED_REWARDS = [
    { id: 'bang-dai-loan', name: 'Cây Bàng Đài Loan', emoji: '🌳' },
    { id: 'sau-rieng-ri6', name: 'Sầu Riêng Ri6', emoji: '🌱' },
    { id: 'luoi-ho', name: 'Cây Lưỡi Hổ', emoji: '🌿' },
    { id: 'mang-cut', name: 'Cây Măng Cụt', emoji: '🌱' },
    { id: 'buoi-da-xanh', name: 'Bưởi Da Xanh', emoji: '🍃' },
    { id: 'chom-chom-thai', name: 'Cây Chôm Chôm Thái', emoji: '🌿' }
];

// Helper lấy userId từ token hoặc request an toàn
function extractUserId(req) {
    return req.user?.id || (req.body && req.body.userId ? parseInt(req.body.userId) : null) || (req.query && req.query.userId ? parseInt(req.query.userId) : null);
}

// ─── 1. Ghi nhận Like bài viết (Được gọi từ explore.js) ──────────────────────
async function recordPostLike(userId, postId) {
    if (!userId || !postId) return;
    try {
        await initDailyTables;
        const todayVN = getVietnamDateStr();
        await pool.query(
            'INSERT IGNORE INTO daily_post_likes (user_id, post_id, like_date) VALUES (?, ?, ?)',
            [userId, postId, todayVN]
        );
    } catch (error) {
        console.error('[recordPostLike] Lỗi ghi nhận like daily task:', error.message);
    }
}

// ─── 2. Ghi nhận Đăng nhập (Được gọi từ auth.js hoặc check-in) ───────────────
async function recordDailyLogin(userId) {
    if (!userId) return;
    try {
        await initDailyTables;
        const todayVN = getVietnamDateStr();
        await pool.query(
            'INSERT IGNORE INTO daily_logins (user_id, login_date) VALUES (?, ?)',
            [userId, todayVN]
        );
    } catch (error) {
        console.error('[recordDailyLogin] Lỗi ghi nhận login daily task:', error.message);
    }
}

// ─── 3. GET /api/daily-tasks (Đọc trạng thái nhiệm vụ - Thuần đọc, không side-effect) ──
async function getDailyTasks(req, res) {
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        const todayVN = getVietnamDateStr();

        if (!userId) {
            // Trả về danh sách mặc định nếu chưa đăng nhập
            const defaultTasks = Object.values(TASK_CONFIGS).map(cfg => ({
                id: cfg.id,
                title: cfg.title,
                description: cfg.description,
                status: 'INCOMPLETE',
                progress: cfg.target ? 0 : undefined,
                target: cfg.target,
                reward: cfg.reward
            }));
            return res.json({ date: todayVN, tasks: defaultTasks });
        }

        // Lấy danh sách nhiệm vụ đã claim trong ngày
        const [claimedRows] = await pool.query(
            'SELECT task_id FROM daily_task_claims WHERE user_id = ? AND task_date = ?',
            [userId, todayVN]
        );
        const claimedSet = new Set(claimedRows.map(r => r.task_id));

        // Kiểm tra thực tế từng nhiệm vụ trong DB
        // 1. daily_login
        const [loginRows] = await pool.query(
            'SELECT id FROM daily_logins WHERE user_id = ? AND login_date = ? LIMIT 1',
            [userId, todayVN]
        );
        const hasLoggedIn = loginRows.length > 0;

        // 2. view_products
        const [viewRows] = await pool.query(
            'SELECT COUNT(DISTINCT product_id) as cnt FROM daily_product_views WHERE user_id = ? AND view_date = ?',
            [userId, todayVN]
        );
        const viewCount = Math.min(3, viewRows[0]?.cnt || 0);

        // 3. like_post
        const [likeRows] = await pool.query(
            'SELECT id FROM daily_post_likes WHERE user_id = ? AND like_date = ? LIMIT 1',
            [userId, todayVN]
        );
        const hasLikedPost = likeRows.length > 0;

        // 4. share_event
        const [shareRows] = await pool.query(
            'SELECT id FROM daily_event_shares WHERE user_id = ? AND share_date = ? LIMIT 1',
            [userId, todayVN]
        );
        const hasSharedEvent = shareRows.length > 0;

        // 5. community_explore
        const [exploreRows] = await pool.query(
            'SELECT id FROM daily_community_explores WHERE user_id = ? AND explore_date = ? LIMIT 1',
            [userId, todayVN]
        );
        const hasExploredCommunity = exploreRows.length > 0;

        // Tổng hợp trạng thái
        const tasks = [
            {
                ...TASK_CONFIGS.daily_login,
                status: claimedSet.has('daily_login')
                    ? 'CLAIMED'
                    : (hasLoggedIn ? 'CLAIMABLE' : 'INCOMPLETE')
            },
            {
                ...TASK_CONFIGS.view_products,
                progress: viewCount,
                target: 3,
                status: claimedSet.has('view_products')
                    ? 'CLAIMED'
                    : (viewCount >= 3 ? 'CLAIMABLE' : 'INCOMPLETE')
            },
            {
                ...TASK_CONFIGS.like_post,
                status: claimedSet.has('like_post')
                    ? 'CLAIMED'
                    : (hasLikedPost ? 'CLAIMABLE' : 'INCOMPLETE')
            },
            {
                ...TASK_CONFIGS.share_event,
                status: claimedSet.has('share_event')
                    ? 'CLAIMED'
                    : (hasSharedEvent ? 'CLAIMABLE' : 'INCOMPLETE')
            },
            {
                ...TASK_CONFIGS.community_explore,
                status: claimedSet.has('community_explore')
                    ? 'CLAIMED'
                    : (hasExploredCommunity ? 'CLAIMABLE' : 'INCOMPLETE')
            }
        ];

        if (typeof res.set === 'function') {
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            });
        }

        res.json({
            date: todayVN,
            tasks: tasks
        });

    } catch (error) {
        console.error('[getDailyTasks] Lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách nhiệm vụ', error: error.message });
    }
}

// ─── 4. POST /api/daily-tasks/check-in (Điểm danh / Daily Login cho active session) ──
async function checkIn(req, res) {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
        }
        await recordDailyLogin(userId);
        res.json({ success: true, message: 'Đã điểm danh hôm nay' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi điểm danh: ' + error.message });
    }
}

// ─── 5. POST /api/daily-tasks/product-view (Ghi nhận xem sản phẩm) ────────────
async function recordProductViewAction(req, res) {
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
        }
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Thiếu productId' });
        }

        const todayVN = getVietnamDateStr();
        await pool.query(
            'INSERT IGNORE INTO daily_product_views (user_id, product_id, view_date) VALUES (?, ?, ?)',
            [userId, productId, todayVN]
        );

        const [rows] = await pool.query(
            'SELECT COUNT(DISTINCT product_id) as cnt FROM daily_product_views WHERE user_id = ? AND view_date = ?',
            [userId, todayVN]
        );
        const currentCount = Math.min(3, rows[0]?.cnt || 0);

        res.json({
            success: true,
            progress: currentCount,
            target: 3,
            completed: currentCount >= 3
        });
    } catch (error) {
        console.error('[recordProductViewAction] Lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi ghi nhận xem sản phẩm', error: error.message });
    }
}

// ─── 6. POST /api/daily-tasks/community-explore (Ghi nhận vào màn hình cộng đồng) ─
async function recordCommunityExploreAction(req, res) {
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
        }

        const todayVN = getVietnamDateStr();
        await pool.query(
            'INSERT IGNORE INTO daily_community_explores (user_id, explore_date) VALUES (?, ?)',
            [userId, todayVN]
        );

        res.json({
            success: true,
            completed: true,
            message: 'Đã ghi nhận khám phá cộng đồng'
        });
    } catch (error) {
        console.error('[recordCommunityExploreAction] Lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi ghi nhận khám phá cộng đồng', error: error.message });
    }
}

// ─── 7. POST /api/daily-tasks/event-share (Ghi nhận chia sẻ sự kiện) ─────────
async function recordEventShareAction(req, res) {
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
        }

        const todayVN = getVietnamDateStr();
        await pool.query(
            'INSERT IGNORE INTO daily_event_shares (user_id, share_date) VALUES (?, ?)',
            [userId, todayVN]
        );

        res.json({
            success: true,
            completed: true,
            message: 'Đã ghi nhận chia sẻ sự kiện'
        });
    } catch (error) {
        console.error('[recordEventShareAction] Lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi ghi nhận chia sẻ sự kiện', error: error.message });
    }
}

// ─── 8. POST /api/daily-tasks/:taskId/claim (Nhận thưởng - Backend là Single Source of Truth) ──
// ─── 8. POST /api/daily-tasks/:taskId/claim (Nhận thưởng - Backend là Single Source of Truth & ACID Transaction) ──
async function claimTask(req, res) {
    let connection = null;
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        const { taskId } = req.params;

        // 1. Kiểm tra đăng nhập
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để nhận thưởng' });
        }

        // 2. Kiểm tra task có hợp lệ
        const taskConfig = TASK_CONFIGS[taskId];
        if (!taskConfig) {
            return res.status(404).json({ success: false, message: 'Nhiệm vụ không tồn tại' });
        }

        const todayVN = getVietnamDateStr();

        // Lấy connection từ pool để thực hiện Transaction nguyên tử
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. Kiểm tra xem đã nhận thưởng nhiệm vụ này hôm nay chưa (khóa hàng với FOR UPDATE chống double-claim)
        const [claimedRows] = await connection.query(
            'SELECT id FROM daily_task_claims WHERE user_id = ? AND task_id = ? AND task_date = ? FOR UPDATE',
            [userId, taskId, todayVN]
        );
        if (claimedRows.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bạn đã nhận phần thưởng nhiệm vụ hôm nay'
            });
        }

        // 4. XÁC THỰC ĐIỀU KIỆN THỰC TẾ TRONG DATABASE (KHÔNG TIN DỮ LIỆU FRONTEND)
        let isConditionMet = false;

        switch (taskId) {
            case 'daily_login': {
                const [rows] = await connection.query(
                    'SELECT id FROM daily_logins WHERE user_id = ? AND login_date = ? LIMIT 1',
                    [userId, todayVN]
                );
                isConditionMet = rows.length > 0;
                break;
            }
            case 'view_products': {
                const [rows] = await connection.query(
                    'SELECT COUNT(DISTINCT product_id) as cnt FROM daily_product_views WHERE user_id = ? AND view_date = ?',
                    [userId, todayVN]
                );
                isConditionMet = (rows[0]?.cnt || 0) >= 3;
                break;
            }
            case 'like_post': {
                const [rows] = await connection.query(
                    'SELECT id FROM daily_post_likes WHERE user_id = ? AND like_date = ? LIMIT 1',
                    [userId, todayVN]
                );
                isConditionMet = rows.length > 0;
                break;
            }
            case 'share_event': {
                const [rows] = await connection.query(
                    'SELECT id FROM daily_event_shares WHERE user_id = ? AND share_date = ? LIMIT 1',
                    [userId, todayVN]
                );
                isConditionMet = rows.length > 0;
                break;
            }
            case 'community_explore': {
                const [rows] = await connection.query(
                    'SELECT id FROM daily_community_explores WHERE user_id = ? AND explore_date = ? LIMIT 1',
                    [userId, todayVN]
                );
                isConditionMet = rows.length > 0;
                break;
            }
            default:
                isConditionMet = false;
        }

        if (!isConditionMet) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa hoàn thành nhiệm vụ này'
            });
        }

        // 5. NẾU LÀ REWARD SEED: THÊM VÀO KHO user_seed_inventory TRƯỚC (QUAN TRỌNG)
        const reward = taskConfig.reward;
        let updatedTurns = null;
        let rewardSeed = null;
        let inventorySeed = null;

        if (reward.type === 'seed') {
            // Chọn ngẫu nhiên 1 hạt giống từ SEED_REWARDS
            rewardSeed = SEED_REWARDS[Math.floor(Math.random() * SEED_REWARDS.length)];

            // Thêm hạt giống vào kho thật: nếu đã có thì cộng dồn quantity, chưa có thì tạo mới quantity = 1
            await connection.query(`
                INSERT INTO user_seed_inventory (user_id, seed_id, quantity)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE quantity = quantity + 1
            `, [userId, rewardSeed.id]);

            // Lấy lại số lượng hạt giống trong kho sau khi cộng
            const [invRows] = await connection.query(
                'SELECT quantity FROM user_seed_inventory WHERE user_id = ? AND seed_id = ?',
                [userId, rewardSeed.id]
            );

            inventorySeed = {
                id: rewardSeed.id,
                name: rewardSeed.name,
                emoji: rewardSeed.emoji,
                quantity: invRows[0]?.quantity || 1
            };
        }

        // 6. GHI NHẬN CLAIM NGUYÊN TỬ VÀO daily_task_claims (Chống double-claim đồng thời bằng Unique Key)
        try {
            await connection.query(
                'INSERT INTO daily_task_claims (user_id, task_id, task_date, reward_type, reward_amount) VALUES (?, ?, ?, ?, ?)',
                [userId, taskId, todayVN, taskConfig.reward.type, taskConfig.reward.amount]
            );
        } catch (dupError) {
            await connection.rollback();
            if (dupError.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã nhận phần thưởng nhiệm vụ hôm nay'
                });
            }
            throw dupError;
        }

        // 7. CỘNG PHẦN THƯỞNG VÀO TIẾN TRÌNH SỰ KIỆN (event_progress)
        const nowMs = Date.now();
        await connection.query(`
            INSERT INTO event_progress (user_id, stage, stage_start_time, time_reduced, water_turns, fert_turns, water_max, fert_max, missions, claimed_vouchers, last_daily_reset_date)
            VALUES (?, 0, ?, 0, 3, 1, 3, 1, '[]', '[]', ?)
            ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
        `, [userId, nowMs, todayVN]);

        if (reward.type === 'water') {
            await connection.query(`
                UPDATE event_progress
                SET water_turns = water_turns + 1,
                    water_max = GREATEST(water_max, water_turns + 1)
                WHERE user_id = ?
            `, [userId]);
        } else if (reward.type === 'fertilizer') {
            await connection.query(`
                UPDATE event_progress
                SET fert_turns = fert_turns + 1,
                    fert_max = GREATEST(fert_max, fert_turns + 1)
                WHERE user_id = ?
            `, [userId]);
        } else if (reward.type === 'seed') {
            await connection.query(`
                UPDATE event_progress
                SET last_seed_claim_date = ?
                WHERE user_id = ?
            `, [todayVN, userId]);
        }

        // Lấy lại thông tin lượt mới nhất
        const [progressRows] = await connection.query(
            'SELECT water_turns, fert_turns, water_max, fert_max FROM event_progress WHERE user_id = ?',
            [userId]
        );
        if (progressRows.length > 0) {
            updatedTurns = progressRows[0];
        }

        // COMMIT TRANSACTION THÀNH CÔNG NGUYÊN TỬ
        await connection.commit();

        console.log(`[daily_tasks] User ${userId} claim thành công task ${taskId} (ngày ${todayVN}) - seed=${rewardSeed?.id || 'none'}`);

        return res.json({
            success: true,
            taskId: taskId,
            status: 'CLAIMED',
            reward: reward,
            updatedTurns: updatedTurns,
            rewardSeed: rewardSeed,
            inventorySeed: inventorySeed,
            message: `Nhận thưởng thành công nhiệm vụ "${taskConfig.title}"`
        });

    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr); }
        }
        console.error('[claimTask] Lỗi:', error);
        return res.status(500).json({ success: false, message: 'Không thể thêm hạt giống vào kho. Vui lòng thử lại.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
}

// ─── 9. GET /api/daily-tasks/seed-inventory (Lấy kho hạt giống thật của user) ────
async function getSeedInventory(req, res) {
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        if (!userId) {
            return res.json({ success: true, inventory: [] });
        }

        const [rows] = await pool.query(
            'SELECT seed_id, quantity, updated_at FROM user_seed_inventory WHERE user_id = ? AND quantity > 0 ORDER BY updated_at DESC',
            [userId]
        );

        // Gắn thêm metadata từ SEED_REWARDS nếu có
        const enriched = rows.map(r => {
            const meta = SEED_REWARDS.find(s => s.id === r.seed_id);
            return {
                seed_id: r.seed_id,
                quantity: r.quantity,
                name: meta ? meta.name : r.seed_id,
                emoji: meta ? meta.emoji : '🌱',
                updated_at: r.updated_at
            };
        });

        res.json({
            success: true,
            inventory: enriched
        });
    } catch (error) {
        console.error('[getSeedInventory] Lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy kho hạt giống', error: error.message });
    }
}

// ─── 10. POST /api/daily-tasks/seed-inventory/consume (Tiêu hao 1 hạt giống khi trồng) ────
async function consumeSeedAction(req, res) {
    let connection = null;
    try {
        await initDailyTables;
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
        }

        const { seedId } = req.body;
        if (!seedId) {
            return res.status(400).json({ success: false, message: 'Thiếu seedId' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT quantity FROM user_seed_inventory WHERE user_id = ? AND seed_id = ? FOR UPDATE',
            [userId, seedId]
        );

        if (rows.length === 0 || rows[0].quantity <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bạn không có hạt giống này trong kho!'
            });
        }

        const newQuantity = rows[0].quantity - 1;
        if (newQuantity <= 0) {
            await connection.query(
                'DELETE FROM user_seed_inventory WHERE user_id = ? AND seed_id = ?',
                [userId, seedId]
            );
        } else {
            await connection.query(
                'UPDATE user_seed_inventory SET quantity = ? WHERE user_id = ? AND seed_id = ?',
                [newQuantity, userId, seedId]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            seedId,
            remainingQuantity: Math.max(0, newQuantity),
            message: 'Đã sử dụng hạt giống thành công'
        });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (rbErr) {}
        }
        console.error('[consumeSeedAction] Lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi sử dụng hạt giống: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getVietnamDateStr,
    recordPostLike,
    recordDailyLogin,
    getDailyTasks,
    checkIn,
    recordProductViewAction,
    recordCommunityExploreAction,
    recordEventShareAction,
    claimTask,
    getSeedInventory,
    consumeSeedAction,
    SEED_REWARDS
};
