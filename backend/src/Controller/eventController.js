const pool = require('../db.js'); // Đường dẫn tới file cấu hình kết nối MySQL pool của bạn

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
            await pool.query(
                'INSERT INTO user_plants (user_id, plant_type, current_level, current_water, target_water) VALUES (?, "Cay_Luxury", 1, 0, 100)',
                [userId]
            );
            const [newPlants] = await pool.query('SELECT * FROM user_plants WHERE user_id = ? AND is_harvested = false LIMIT 1', [userId]);
            plant = newPlants[0];
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
