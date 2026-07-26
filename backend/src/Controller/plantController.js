const db = require('../config/db'); // Kết nối MySQL (sử dụng mysql2/promise)

// 1. Lấy trạng thái cây và kiểm tra phạt quá 48h chưa tưới
exports.getPlantStatus = async (req, res) => {
    const { userId } = req.query;
    try {
        // Lấy số nước của user
        const [users] = await db.query('SELECT water_balance FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User không tồn tại' });

        // Lấy thông tin cây hiện tại chưa thu hoạch
        const [plants] = await db.query(
            'SELECT * FROM user_plants WHERE user_id = ? AND is_harvested = false LIMIT 1',
            [userId]
        );

        // Nếu user chưa có cây nào, tự động tạo mới 1 hạt mầm cấp 1
        let plant = plants[0];
        if (!plant) {
            await db.query(
                'INSERT INTO user_plants (user_id, plant_type, current_level, current_water, target_water) VALUES (?, "Cay_Tao", 1, 0, 100)',
                [userId]
            );
            const [newPlants] = await db.query('SELECT * FROM user_plants WHERE user_id = ? AND is_harvested = false LIMIT 1', [userId]);
            plant = newPlants[0];
        }

        // --- Logic kiểm tra 48 giờ không tưới nước ---
        let isShrunk = false;
        const lastWatered = new Date(plant.last_watered_at);
        const now = new Date();
        const diffHours = Math.abs(now - lastWatered) / 36e5; // Quy đổi ra số giờ chênh lệch

        // Nếu quá 48h và cấp độ cây đang lớn hơn 1 thì phạt hạ 1 cấp
        if (diffHours >= 48 && plant.current_level > 1) {
            plant.current_level -= 1;
            plant.current_water = 0; // Reset tiến trình level đó
            isShrunk = true;

            // Cập nhật lại vào DB và làm mới mốc thời gian để không phạt liên tục lập tức
            await db.query(
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

// 2. Logic Tưới Nước
exports.waterPlant = async (req, res) => {
    const { userId, plantId } = req.body;
    const waterCost = 10; // Mỗi lần tưới tốn 10 giọt nước

    try {
        const [user] = await db.query('SELECT water_balance FROM users WHERE id = ?', [userId]);
        if (user[0].water_balance < waterCost) {
            return res.status(400).json({ message: 'Bạn không đủ nước! Hãy chơi minigame để kiếm thêm.' });
        }

        const [plant] = await db.query('SELECT * FROM user_plants WHERE id = ?', [plantId]);
        if (!plant[0]) return res.status(404).json({ message: 'Không tìm thấy cây.' });

        // Trừ nước của user
        await db.query('UPDATE users SET water_balance = water_balance - ? WHERE id = ?', [waterCost, userId]);

        let newWater = plant[0].current_water + waterCost;
        let newLevel = plant[0].current_level;
        let targetWater = plant[0].target_water;
        let isHarvested = false;
        let msg = "Tưới nước thành công! +10 giọt.";

        // Xử lý lên cấp khi đủ nước
        if (newWater >= targetWater) {
            if (newLevel >= 3) { // Giả định cấp 3 là max cấp
                isHarvested = true;
                msg = "Cây đã đạt kích thước tối đa! Bạn có thể thu hoạch voucher ngay.";
            } else {
                newLevel += 1;
                newWater = 0;
                targetWater = targetWater * 1.5; // Tăng độ khó cho cấp sau
                msg = `Chúc mừng! Cây đã lớn hơn và đạt Cấp ${newLevel}!`;
            }
        }

        // Cập nhật trạng thái cây và reset mốc thời gian last_watered_at về hiện tại
        await db.query(
            'UPDATE user_plants SET current_level = ?, current_water = ?, target_water = ?, is_harvested = ?, last_watered_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newLevel, newWater, targetWater, isHarvested, plantId]
        );

        res.json({ message: msg });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Logic Thu hoạch nhận mã giảm giá
exports.harvestVoucher = async (req, res) => {
    const { userId, plantId } = req.body;
    try {
        const [plant] = await db.query('SELECT * FROM user_plants WHERE id = ? AND user_id = ?', [plantId, userId]);
        if (!plant[0] || !plant[0].is_harvested) {
            return res.status(400).json({ message: 'Cây chưa đạt trạng thái thu hoạch!' });
        }

        // Tạo chuỗi mã Voucher ngẫu nhiên
        const voucherCode = "LUXURY_" + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Xóa cây cũ hoặc chuyển trạng thái để user có thể trồng lại cây mới ở lượt sau
        await db.query('DELETE FROM user_plants WHERE id = ?', [plantId]);

        res.json({ success: true, voucherCode: voucherCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};