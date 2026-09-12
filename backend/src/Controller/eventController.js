const pool = require('../db.js'); // Đường dẫn tới file cấu hình kết nối MySQL pool của bạn

const getDayKey = (timestamp = Date.now()) => {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const shouldResetDailyProgress = (progress = {}) => {
    const currentDayKey = getDayKey();
    const lastResetDay = Number(progress.last_reset_day || 0);
    const stageStartDayKey = getDayKey(Number(progress.stage_start_time || Date.now()));
    return lastResetDay < currentDayKey || stageStartDayKey < currentDayKey;
};

const resetProgressForNewDay = (progress = {}, resetReason = 'daily') => ({
    selected_seed: progress.selected_seed || null,
    stage: 1,
    stage_start_time: Date.now(),
    time_reduced: 0,
    water_turns: 3,
    fert_turns: 1,
    water_max: 3,
    fert_max: 1,
    missions: [false, false, false, false, false],
    claimed_vouchers: [],
    notif_on: Boolean(progress.notif_on),
    last_reset_day: getDayKey(),
    reset_reason: resetReason,
});

const ensureProgressTable = Promise.all([
    pool.query(`
        CREATE TABLE IF NOT EXISTS event_progress (
            user_id INT PRIMARY KEY,
            selected_seed VARCHAR(100) NULL,
            stage TINYINT NOT NULL DEFAULT 0,
            stage_start_time BIGINT NOT NULL,
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
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `),
    pool.query(`
        ALTER TABLE event_progress
        ADD COLUMN IF NOT EXISTS last_reset_day BIGINT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS reset_reason VARCHAR(50) NOT NULL DEFAULT 'daily'
    `)
]).catch(error => console.error('Lỗi tạo bảng event_progress:', error.message));

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

exports.getProgress = async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

    try {
        await ensureProgressTable;
        const [rows] = await pool.query('SELECT * FROM event_progress WHERE user_id = ?', [userId]);
        if (rows.length === 0) return res.json({ success: true, data: null });

        const progress = rows[0];
        const shouldReset = shouldResetDailyProgress(progress);
        const nextProgress = shouldReset ? resetProgressForNewDay(progress, progress.reset_reason || 'daily') : progress;

        if (shouldReset) {
            await pool.query(`
                UPDATE event_progress
                SET selected_seed = ?, stage = ?, stage_start_time = ?, time_reduced = ?,
                    water_turns = ?, fert_turns = ?, water_max = ?, fert_max = ?,
                    missions = ?, claimed_vouchers = ?, notif_on = ?, last_reset_day = ?, reset_reason = ?
                WHERE user_id = ?
            `, [
                nextProgress.selected_seed,
                nextProgress.stage,
                nextProgress.stage_start_time,
                nextProgress.time_reduced,
                nextProgress.water_turns,
                nextProgress.fert_turns,
                nextProgress.water_max,
                nextProgress.fert_max,
                JSON.stringify(nextProgress.missions),
                JSON.stringify(nextProgress.claimed_vouchers),
                Boolean(nextProgress.notif_on),
                nextProgress.last_reset_day,
                nextProgress.reset_reason || 'daily',
                userId,
            ]);
        }

        const returnedProgress = { ...nextProgress, missions: parseJsonValue(nextProgress.missions), claimed_vouchers: parseJsonValue(nextProgress.claimed_vouchers) };
        const responseResetReason = returnedProgress.reset_reason || 'daily';
        console.log('[event_progress]', { userId, shouldReset, reset_reason: responseResetReason });
        res.json({ success: true, data: returnedProgress, reset_reason: responseResetReason });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

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
        const [existingRows] = await pool.query('SELECT * FROM event_progress WHERE user_id = ?', [userId]);
        const currentProgress = existingRows[0] || {};
        const resetRequired = shouldResetDailyProgress(currentProgress);
        const nextProgress = resetRequired
            ? resetProgressForNewDay({
                ...currentProgress,
                selected_seed: selectedSeed || currentProgress.selected_seed || null,
                stage: stage ?? 1,
                stage_start_time: stageStartTime || Date.now(),
                time_reduced: timeReduced || 0,
                water_turns: waterTurns ?? 3,
                fert_turns: fertTurns ?? 1,
                water_max: waterMax ?? 3,
                fert_max: fertMax ?? 1,
                missions,
                claimed_vouchers: claimedVouchers,
                notif_on: Boolean(notifOn),
                reset_reason: resetReason || 'daily',
            }, resetReason || 'daily')
            : {
                selected_seed: selectedSeed || currentProgress.selected_seed || null,
                stage: stage ?? currentProgress.stage ?? 0,
                stage_start_time: stageStartTime || currentProgress.stage_start_time || Date.now(),
                time_reduced: timeReduced || currentProgress.time_reduced || 0,
                water_turns: waterTurns ?? currentProgress.water_turns ?? 3,
                fert_turns: fertTurns ?? currentProgress.fert_turns ?? 1,
                water_max: waterMax ?? currentProgress.water_max ?? 3,
                fert_max: fertMax ?? currentProgress.fert_max ?? 1,
                missions,
                claimed_vouchers: claimedVouchers,
                notif_on: Boolean(notifOn),
                last_reset_day: getDayKey(),
                reset_reason: resetReason || currentProgress.reset_reason || 'daily',
            };

        await pool.query(`
            INSERT INTO event_progress
                (user_id, selected_seed, stage, stage_start_time, time_reduced, water_turns, fert_turns,
                 water_max, fert_max, missions, claimed_vouchers, notif_on, last_reset_day, reset_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                selected_seed = VALUES(selected_seed), stage = VALUES(stage),
                stage_start_time = VALUES(stage_start_time), time_reduced = VALUES(time_reduced),
                water_turns = VALUES(water_turns), fert_turns = VALUES(fert_turns),
                water_max = VALUES(water_max), fert_max = VALUES(fert_max),
                missions = VALUES(missions), claimed_vouchers = VALUES(claimed_vouchers),
                notif_on = VALUES(notif_on), last_reset_day = VALUES(last_reset_day), reset_reason = VALUES(reset_reason)
        `, [
            userId,
            nextProgress.selected_seed || null,
            nextProgress.stage ?? 0,
            nextProgress.stage_start_time || Date.now(),
            nextProgress.time_reduced || 0,
            nextProgress.water_turns ?? 3,
            nextProgress.fert_turns ?? 1,
            nextProgress.water_max ?? 3,
            nextProgress.fert_max ?? 1,
            JSON.stringify(nextProgress.missions),
            JSON.stringify(nextProgress.claimed_vouchers),
            Boolean(nextProgress.notif_on),
            nextProgress.last_reset_day || getDayKey(),
            nextProgress.reset_reason || 'daily',
        ]);
        const responseResetReason = nextProgress.reset_reason || 'daily';
        console.log('[event_progress_save]', { userId, reset_reason: responseResetReason, stage: nextProgress.stage });
        res.json({ success: true, message: 'Đã lưu tiến trình sự kiện', reset_reason: responseResetReason });
    } catch (error) {
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
