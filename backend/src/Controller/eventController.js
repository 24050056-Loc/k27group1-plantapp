const pool = require('../db.js'); // Đường dẫn tới file cấu hình kết nối MySQL pool của bạn

// ─── Timezone & Ngày theo Việt Nam ────────────────────────────────────────────
const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo timezone Việt Nam (Asia/Ho_Chi_Minh).
 * Đây là nguồn DUY NHẤT để xác định "ngày hiện tại" trong toàn bộ hệ thống.
 * Đảm bảo Frontend và Backend thống nhất timezone — tránh reset sai giờ do UTC.
 */
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

/**
 * Chuyển đổi giá trị ngày từ MySQL (Date object hoặc chuỗi) thành YYYY-MM-DD theo VN timezone.
 * mysql2 trả về Date object cho cột kiểu DATE, nên dùng Intl formatter để tránh lệch timezone UTC.
 */
const toDateStrVN = (val) => {
    if (!val) return null;
    if (val instanceof Date) {
        return getVietnamDateStr(val);
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
        return getVietnamDateStr(d);
    }
    return null;
};

/**
 * Kiểm tra xem tiến trình của user có cần Daily Reset không.
 * So sánh last_daily_reset_date (DATE string YYYY-MM-DD) với ngày VN hiện tại.
 *
 * ĐÂY LÀ ĐIỀU KIỆN DUY NHẤT để kích hoạt Daily Reset:
 *   last_daily_reset_date != today_VN
 *
 * Đảm bảo idempotency: sau khi reset, cập nhật last_daily_reset_date = today
 * → không bao giờ reset 2 lần trong cùng một ngày, dù gọi API bao nhiêu lần.
 */
const shouldDailyReset = (progress = {}) => {
    const todayVN = getVietnamDateStr();
    const lastResetDate = toDateStrVN(progress.last_daily_reset_date);
    return lastResetDate !== todayVN;
};

/**
 * Kiểm tra user có thể nhận seed hôm nay không.
 * Dùng last_seed_claim_date (DATE string theo VN timezone).
 * Giới hạn: 1 lần/ngày.
 */
const canClaimSeedToday = (progress = {}) => {
    const todayVN = getVietnamDateStr();
    const lastClaimDate = toDateStrVN(progress.last_seed_claim_date);
    return lastClaimDate !== todayVN;
};

// ─── Giá trị mặc định mỗi ngày ────────────────────────────────────────────────
const DEFAULT_WATER_TURNS = 3;
const DEFAULT_FERT_TURNS = 1;

// ─── Schema Migration (tự động khi khởi động) ────────────────────────────────
const ensureProgressTable = (async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event_progress (
                user_id INT PRIMARY KEY,
                selected_seed VARCHAR(100) NULL,
                stage TINYINT NOT NULL DEFAULT 0,
                stage_start_time BIGINT NOT NULL DEFAULT 0,
                time_reduced BIGINT NOT NULL DEFAULT 0,
                water_turns INT NOT NULL DEFAULT 3,
                fert_turns INT NOT NULL DEFAULT 1,
                water_max INT NOT NULL DEFAULT 3,
                fert_max INT NOT NULL DEFAULT 1,
                missions JSON NOT NULL,
                claimed_vouchers JSON NOT NULL,
                notif_on BOOLEAN NOT NULL DEFAULT FALSE,
                last_reset_day BIGINT NOT NULL DEFAULT 0,
                reset_reason VARCHAR(50) NOT NULL DEFAULT 'daily',
                last_daily_reset_date DATE NULL,
                last_seed_claim_date DATE NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Kiểm tra và bổ sung các cột còn thiếu một cách an toàn trên mọi phiên bản MySQL
        const [existingCols] = await pool.query('SHOW COLUMNS FROM event_progress');
        const colNames = existingCols.map(c => c.Field);

        if (!colNames.includes('last_reset_day')) {
            await pool.query('ALTER TABLE event_progress ADD COLUMN last_reset_day BIGINT NOT NULL DEFAULT 0');
        }
        if (!colNames.includes('reset_reason')) {
            await pool.query("ALTER TABLE event_progress ADD COLUMN reset_reason VARCHAR(50) NOT NULL DEFAULT 'daily'");
        }
        if (!colNames.includes('last_daily_reset_date')) {
            await pool.query('ALTER TABLE event_progress ADD COLUMN last_daily_reset_date DATE NULL');
        }
        if (!colNames.includes('last_seed_claim_date')) {
            await pool.query('ALTER TABLE event_progress ADD COLUMN last_seed_claim_date DATE NULL');
        }
    } catch (error) {
        console.error('Lỗi tạo/migrate bảng event_progress:', error.message);
    }
})();

// ─── Seed Catalog ──────────────────────────────────────────────────────────────
const seedCatalog = [
    { id: 'sen', name: 'Hoa Sen', category: 'Dưới nước' },
    { id: 'sung', name: 'Hoa Súng', category: 'Dưới nước' },
    { id: 'tao', name: 'Cây Táo', category: 'Ăn quả' },
    { id: 'cam', name: 'Cây Cam', category: 'Ăn quả' },
    { id: 'bang', name: 'Cây Bàng', category: 'Bóng râm' },
    { id: 'xacu', name: 'Cây Xà Cừ', category: 'Bóng râm' },
    { id: 'hoahong', name: 'Hoa Hồng', category: 'Hoa cảnh' },
    { id: 'huongduong', name: 'Hướng Dương', category: 'Hoa cảnh' }
];

const parseJsonValue = value => typeof value === 'string' ? JSON.parse(value || '[]') : (value || []);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/game/progress — Lấy tiến trình & tự động Daily Reset nếu sang ngày mới
// ─────────────────────────────────────────────────────────────────────────────
exports.getProgress = async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

    try {
        await ensureProgressTable;
        const [rows] = await pool.query('SELECT * FROM event_progress WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            return res.json({ success: true, data: null, was_daily_reset: false });
        }

        const progress = rows[0];
        const needsDailyReset = shouldDailyReset(progress);

        if (needsDailyReset) {
            // ── DAILY RESET ──────────────────────────────────────────────────
            // Kích hoạt khi last_daily_reset_date != ngày VN hiện tại.
            //
            // Reset TOÀN BỘ tiến độ ngày:
            //   • stage = 0 (chưa có cây, hasSeed = false)
            //   • selected_seed = null
            //   • missions = [false × 5]
            //   • water_turns = 3 (về mặc định, không cộng dồn từ ngày trước)
            //   • fert_turns = 1 (về mặc định)
            //   • claimed_vouchers = [] (cycle mới)
            //
            // KHÔNG reset: notif_on, last_seed_claim_date
            // Cập nhật: last_daily_reset_date = today_VN (đảm bảo chỉ reset 1 lần/ngày)
            const todayVN = getVietnamDateStr();
            const nowTs = Date.now();

            await pool.query(`
                UPDATE event_progress
                SET selected_seed = NULL,
                    stage = 0,
                    stage_start_time = ?,
                    time_reduced = 0,
                    water_turns = ?,
                    fert_turns = ?,
                    water_max = ?,
                    fert_max = ?,
                    missions = ?,
                    claimed_vouchers = '[]',
                    last_daily_reset_date = ?,
                    reset_reason = 'daily'
                WHERE user_id = ?
            `, [
                nowTs,
                DEFAULT_WATER_TURNS,
                DEFAULT_FERT_TURNS,
                DEFAULT_WATER_TURNS,
                DEFAULT_FERT_TURNS,
                JSON.stringify([false, false, false, false, false]),
                todayVN,
                userId,
            ]);

            console.log(`[daily_reset] userId=${userId} ngày=${todayVN} (Asia/Ho_Chi_Minh) ✅`);

            return res.json({
                success: true,
                was_daily_reset: true, // Flag để frontend biết đã reset ngày mới
                data: {
                    selected_seed: null,
                    stage: 0,
                    stage_start_time: nowTs,
                    time_reduced: 0,
                    water_turns: DEFAULT_WATER_TURNS,
                    fert_turns: DEFAULT_FERT_TURNS,
                    water_max: DEFAULT_WATER_TURNS,
                    fert_max: DEFAULT_FERT_TURNS,
                    missions: [false, false, false, false, false],
                    claimed_vouchers: [],
                    notif_on: Boolean(progress.notif_on),
                    last_daily_reset_date: todayVN,
                    last_seed_claim_date: toDateStrVN(progress.last_seed_claim_date),
                    reset_reason: 'daily',
                },
            });
        }

        // ── CÙNG NGÀY: Trả về state hiện tại (không thay đổi gì) ─────────────
        const returnedProgress = {
            ...progress,
            missions: parseJsonValue(progress.missions),
            claimed_vouchers: parseJsonValue(progress.claimed_vouchers),
            last_daily_reset_date: toDateStrVN(progress.last_daily_reset_date),
            last_seed_claim_date: toDateStrVN(progress.last_seed_claim_date),
        };

        console.log(`[get_progress] userId=${userId} same_day=true stage=${progress.stage}`);
        return res.json({
            success: true,
            was_daily_reset: false,
            data: returnedProgress,
        });

    } catch (error) {
        console.error('[getProgress] Lỗi:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/game/progress — Lưu tiến trình (frontend gọi khi thay đổi state)
//
// Lưu ý quan trọng:
//   • Endpoint này CHỈ lưu state, KHÔNG tự reset theo ngày.
//   • last_daily_reset_date được cập nhật bởi getProgress (khi phát hiện ngày mới).
//   • Đây là thiết kế có chủ ý để tránh race condition và đảm bảo idempotency.
// ─────────────────────────────────────────────────────────────────────────────
exports.saveProgress = async (req, res) => {
    const { userId } = req.body;
    const {
        selectedSeed, stage, stageStartTime, timeReduced, waterTurns, fertTurns,
        waterMax, fertMax, missions, claimedVouchers, notifOn, resetReason
    } = req.body;

    if (!userId || !Array.isArray(missions) || !Array.isArray(claimedVouchers)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu tiến trình không hợp lệ' });
    }

    try {
        await ensureProgressTable;

        // Lấy last_daily_reset_date hiện tại để giữ nguyên (saveProgress không được ghi đè)
        const [existingRows] = await pool.query(
            'SELECT last_daily_reset_date, last_seed_claim_date FROM event_progress WHERE user_id = ?',
            [userId]
        );
        const existing = existingRows[0] || {};
        const currentLastResetDate = toDateStrVN(existing.last_daily_reset_date) || getVietnamDateStr();

        await pool.query(`
            INSERT INTO event_progress
                (user_id, selected_seed, stage, stage_start_time, time_reduced, water_turns, fert_turns,
                 water_max, fert_max, missions, claimed_vouchers, notif_on,
                 last_reset_day, reset_reason, last_daily_reset_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            ON DUPLICATE KEY UPDATE
                selected_seed = VALUES(selected_seed),
                stage = VALUES(stage),
                stage_start_time = VALUES(stage_start_time),
                time_reduced = VALUES(time_reduced),
                water_turns = VALUES(water_turns),
                fert_turns = VALUES(fert_turns),
                water_max = VALUES(water_max),
                fert_max = VALUES(fert_max),
                missions = VALUES(missions),
                claimed_vouchers = VALUES(claimed_vouchers),
                notif_on = VALUES(notif_on),
                reset_reason = VALUES(reset_reason)
                -- last_daily_reset_date KHÔNG được cập nhật ở đây
        `, [
            userId,
            selectedSeed || null,
            stage ?? 0,
            stageStartTime || Date.now(),
            timeReduced || 0,
            waterTurns ?? DEFAULT_WATER_TURNS,
            fertTurns ?? DEFAULT_FERT_TURNS,
            waterMax ?? DEFAULT_WATER_TURNS,
            fertMax ?? DEFAULT_FERT_TURNS,
            JSON.stringify(missions),
            JSON.stringify(claimedVouchers),
            Boolean(notifOn),
            resetReason || 'manual',
            currentLastResetDate,
        ]);

        console.log(`[save_progress] userId=${userId} stage=${stage} reason=${resetReason || 'manual'}`);
        res.json({ success: true, message: 'Đã lưu tiến trình sự kiện' });
    } catch (error) {
        console.error('[saveProgress] Lỗi:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/game/claim-seed — Nhận hạt giống ngày hôm nay
//
// Quy tắc:
//   • Giới hạn 1 lần/ngày theo Asia/Ho_Chi_Minh timezone.
//   • Kiểm tra last_seed_claim_date (DATE) so với today_VN.
//   • Nếu cùng ngày → từ chối.
//   • Nếu khác ngày → cho phép, cập nhật last_seed_claim_date = today_VN.
// ─────────────────────────────────────────────────────────────────────────────
exports.claimSeed = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

    try {
        await ensureProgressTable;
        const [rows] = await pool.query(
            'SELECT last_seed_claim_date FROM event_progress WHERE user_id = ?',
            [userId]
        );

        const todayVN = getVietnamDateStr();

        if (rows.length > 0) {
            const lastClaimDate = toDateStrVN(rows[0].last_seed_claim_date);

            if (lastClaimDate === todayVN) {
                return res.status(400).json({
                    success: false,
                    already_claimed: true,
                    message: 'Bạn đã nhận hạt giống hôm nay rồi. Hãy quay lại vào ngày mai!',
                    last_seed_claim_date: lastClaimDate,
                    can_claim_again: false,
                });
            }

            // Cập nhật last_seed_claim_date = hôm nay VN
            await pool.query(
                'UPDATE event_progress SET last_seed_claim_date = ? WHERE user_id = ?',
                [todayVN, userId]
            );
        } else {
            // User chưa có record event_progress, tạo mới
            await pool.query(`
                INSERT INTO event_progress
                    (user_id, selected_seed, stage, stage_start_time, time_reduced,
                     water_turns, fert_turns, water_max, fert_max,
                     missions, claimed_vouchers, notif_on,
                     last_reset_day, reset_reason, last_daily_reset_date, last_seed_claim_date)
                VALUES (?, NULL, 0, ?, 0, ?, ?, ?, ?, ?, '[]', FALSE, 0, 'daily', ?, ?)
            `, [
                userId, Date.now(),
                DEFAULT_WATER_TURNS, DEFAULT_FERT_TURNS,
                DEFAULT_WATER_TURNS, DEFAULT_FERT_TURNS,
                JSON.stringify([false, false, false, false, false]),
                todayVN, todayVN,
            ]);
        }

        // Cấp phát hạt giống ngẫu nhiên từ catalog
        const randomSeed = seedCatalog[Math.floor(Math.random() * seedCatalog.length)];

        console.log(`[claim_seed] userId=${userId} seed=${randomSeed.id} ngày=${todayVN} (VN) ✅`);

        res.json({
            success: true,
            message: `Bạn đã nhận được hạt giống ${randomSeed.name}!`,
            seed: randomSeed,
            last_seed_claim_date: todayVN,
        });
    } catch (error) {
        console.error('[claimSeed] Lỗi:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 0. Lấy danh sách hạt giống
exports.getSeeds = (req, res) => {
    res.json({ success: true, data: seedCatalog });
};

// 0.1 Chọn hạt giống để trồng
exports.choosePlant = async (req, res) => {
    const { userId, seedId } = req.body;
    if (!userId || !seedId) return res.status(400).json({ success: false, message: 'Thiếu thông tin user hoặc seed' });

    try {
        // Kiểm tra hạt giống có tồn tại không
        const seed = seedCatalog.find(s => s.id === seedId);
        if (!seed) return res.status(404).json({ success: false, message: 'Loại cây không hợp lệ' });

        // Kiểm tra xem user đang có cây nào chưa thu hoạch không
        const [existing] = await pool.query(
            'SELECT * FROM user_plants WHERE user_id = ? AND is_harvested = false LIMIT 1', 
            [userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đang trồng một cây rồi, hãy thu hoạch trước khi trồng cây mới!' });
        }

        // Tạo cây mới
        await pool.query(
            'INSERT INTO user_plants (user_id, plant_type, current_level, current_water, target_water) VALUES (?, ?, 1, 0, 100)',
            [userId, seed.name]
        );

        res.json({ success: true, message: `Bạn đã gieo hạt ${seed.name} thành công!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 1. Lấy trạng thái cây và kiểm tra phạt quá 48h chưa tưới
exports.getPlantStatus = async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

    try {
        const [users] = await pool.query('SELECT water_balance FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        const [plants] = await pool.query(
            'SELECT * FROM user_plants WHERE user_id = ? AND is_harvested = false LIMIT 1', 
            [userId]
        );

        let plant = plants[0];
        if (!plant) {
            return res.json({
                success: true,
                waterBalance: users[0].water_balance,
                plant: null,
                message: 'Bạn chưa có cây nào, vui lòng chọn hạt giống để bắt đầu trồng!'
            });
        }

        let isShrunk = false;
        const lastWatered = new Date(plant.last_watered_at);
        const now = new Date();
        const diffHours = Math.abs(now - lastWatered) / (1000 * 60 * 60);

        if (diffHours >= 48 && plant.current_level > 1) {
            plant.current_level -= 1;
            plant.current_water = 0;
            isShrunk = true;
            
            await pool.query(
                'UPDATE user_plants SET current_level = ?, current_water = ?, last_watered_at = CURRENT_TIMESTAMP WHERE id = ?',
                [plant.current_level, plant.current_water, plant.id]
            );
        }

        res.json({
            success: true,
            waterBalance: users[0].water_balance,
            plant: plant,
            isShrunk: isShrunk
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Logic xử lý tưới nước cho cây
exports.waterPlant = async (req, res) => {
    const { userId, plantId } = req.body;
    const waterCost = 10;

    try {
        const [users] = await pool.query('SELECT water_balance FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User không tồn tại' });
        
        if (users[0].water_balance < waterCost) {
            return res.status(400).json({ message: 'Bạn không đủ nước! Hãy chơi minigame để tích lũy thêm.' });
        }

        const [plants] = await pool.query('SELECT * FROM user_plants WHERE id = ?', [plantId]);
        if (plants.length === 0) return res.status(404).json({ message: 'Không tìm thấy cây trồng này.' });

        const plant = plants[0];

        await pool.query('UPDATE users SET water_balance = water_balance - ? WHERE id = ?', [waterCost, userId]);

        let newWater = plant.current_water + waterCost;
        let newLevel = plant.current_level;
        let targetWater = plant.target_water;
        let isHarvested = false;
        let msg = "Tưới nước thành công! Cây nhận thêm 10 giọt nước.";

        if (newWater >= targetWater) {
            if (newLevel >= 3) {
                isHarvested = true;
                msg = "Tuyệt vời! Cây đã lớn tối đa và sẵn sàng thu hoạch lấy Voucher giảm giá!";
            } else {
                newLevel += 1;
                newWater = 0;
                targetWater = Math.round(targetWater * 1.5);
                msg = `Chúc mừng! Cây của bạn đã thăng lên Cấp độ ${newLevel}!`;
            }
        }

        await pool.query(
            'UPDATE user_plants SET current_level = ?, current_water = ?, target_water = ?, is_harvested = ?, last_watered_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newLevel, newWater, targetWater, isHarvested, plantId]
        );

        res.json({ success: true, message: msg });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Logic thu hoạch cây nhận Voucher giảm giá
exports.harvestVoucher = async (req, res) => {
    const { userId, plantId } = req.body;

    try {
        const [plants] = await pool.query('SELECT * FROM user_plants WHERE id = ? AND user_id = ?', [plantId, userId]);
        if (plants.length === 0 || !plants[0].is_harvested) {
            return res.status(400).json({ message: 'Cây chưa đủ lớn hoặc không thể thu hoạch!' });
        }

        const voucherCode = "LUXURY_" + Math.random().toString(36).substring(2, 8).toUpperCase();

        await pool.query('DELETE FROM user_plants WHERE id = ?', [plantId]);

        res.json({ success: true, voucherCode: voucherCode });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Lấy danh sách nhiệm vụ của hệ thống kèm trạng thái của user
exports.getMissions = async (req, res) => {
    const { userId } = req.query;
    try {
        const queryStr = `
            SELECT m.id, m.title, m.reward_water, IFNULL(um.status, 'pending') AS status 
            FROM missions m
            LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ?
        `;
        const [missions] = await pool.query(queryStr, [userId]);
        res.json(missions);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 5. Xử lý nhận nước sau khi hoàn thành minigame tích điểm
exports.completeMission = async (req, res) => {
    const { userId, missionId } = req.body;

    try {
        const [missions] = await pool.query('SELECT reward_water FROM missions WHERE id = ?', [missionId]);
        if (missions.length === 0) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại.' });

        const reward = missions[0].reward_water;

        await pool.query('UPDATE users SET water_balance = water_balance + ? WHERE id = ?', [reward, userId]);

        const insertLog = `
            INSERT INTO user_missions (user_id, mission_id, status) 
            VALUES (?, ?, 'claimed') 
            ON DUPLICATE KEY UPDATE status = 'claimed'
        `;
        await pool.query(insertLog, [userId, missionId]);

        res.json({ success: true, message: `Bạn đã nhận thành công ${reward} giọt nước từ thử thách minigame!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
