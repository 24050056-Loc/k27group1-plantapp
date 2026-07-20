const db = require('../config/db');

// 1. Lấy danh sách nhiệm vụ và so khớp trạng thái hoàn thành của User
exports.getMissions = async (req, res) => {
    const { userId } = req.query;
    try {
        // Thực hiện LEFT JOIN để biết nhiệm vụ nào user đã nhận nước (claimed) trong ngày chưa
        const queryStr = `
            SELECT m.id, m.title, m.reward_water, IFNULL(um.status, 'pending') AS status 
            FROM missions m
            LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ?
        `;
        const [missions] = await db.query(queryStr, [userId]);
        res.json(missions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Nhận thưởng nước sau khi vượt qua thử thách Minigame
exports.completeMission = async (req, res) => {
    const { userId, missionId } = req.body;
    try {
        // Lấy thông tin lượng nước thưởng của nhiệm vụ này
        const [mission] = await db.query('SELECT reward_water FROM missions WHERE id = ?', [missionId]);
        if (mission.length === 0) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại.' });

        const reward = mission[0].reward_water;

        // Cộng nước vào tài khoản user
        await db.query('UPDATE users SET water_balance = water_balance + ? WHERE id = ?', [reward, userId]);

        // Đánh dấu nhiệm vụ này đã hoàn thành thu thập (claimed)
        const insertMissionLog = `
            INSERT INTO user_missions (user_id, mission_id, status) 
            VALUES (?, ?, 'claimed') 
            ON DUPLICATE KEY UPDATE status = 'claimed'
        `;
        await db.query(insertMissionLog, [userId, missionId]);

        res.json({ message: `Chúc mừng bạn đã hoàn thành minigame và nhận được ${reward} giọt nước!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};