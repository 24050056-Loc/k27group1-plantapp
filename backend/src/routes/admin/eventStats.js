const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { verifyToken, isAdmin } = require('../../middlewares/authadmin');

// GET /api/admin/events/stats
router.get('/events/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const [[{ total_participants }]] = await pool.execute("SELECT COUNT(*) as total_participants FROM event_progress");
        
        // Users per stage
        const [stages] = await pool.execute(`
            SELECT stage, COUNT(*) as count 
            FROM event_progress 
            GROUP BY stage
        `);
        
        const [[{ total_vouchers_issued }]] = await pool.execute("SELECT COUNT(*) as total_vouchers_issued FROM user_coupons WHERE code LIKE 'PLANT%'");
        const [[{ available_vouchers }]] = await pool.execute("SELECT COUNT(*) as available_vouchers FROM user_coupons WHERE code LIKE 'PLANT%' AND status = 'available'");
        const [[{ used_vouchers }]] = await pool.execute("SELECT COUNT(*) as used_vouchers FROM user_coupons WHERE code LIKE 'PLANT%' AND status = 'used'");
        
        // Vouchers per stage
        const [vouchers_per_stage] = await pool.execute(`
            SELECT source_stage, COUNT(*) as count 
            FROM user_coupons 
            WHERE code LIKE 'PLANT%' AND source_stage IS NOT NULL 
            GROUP BY source_stage
        `);

        res.json({
            success: true,
            data: {
                total_participants: total_participants || 0,
                stages_distribution: stages,
                vouchers: {
                    total: total_vouchers_issued || 0,
                    available: available_vouchers || 0,
                    used: used_vouchers || 0,
                    per_stage: vouchers_per_stage
                }
            }
        });
    } catch (error) {
        console.error("Lỗi thống kê event:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// GET /api/admin/quests/stats
router.get('/quests/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        // Daily Quest Stats
        const [rows] = await pool.execute("SELECT missions, last_daily_reset_date, last_seed_claim_date FROM event_progress");
        
        const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
        const [month, day, year] = today.split('/');
        const todayStr = `${year}-${month}-${day}`; // YYYY-MM-DD
        
        let loginCompleted = 0;
        let viewProductCompleted = 0;
        let seedClaimed = 0;
        
        // Xử lý json missions
        rows.forEach(row => {
            // Check seed claimed today
            if (row.last_seed_claim_date) {
                const claimDateStr = new Date(row.last_seed_claim_date).toISOString().split('T')[0];
                if (claimDateStr === todayStr) {
                    seedClaimed++;
                }
            }
            
            // Check missions
            if (row.missions) {
                let missionsObj = {};
                if (typeof row.missions === 'string') {
                    try { missionsObj = JSON.parse(row.missions); } catch(e) {}
                } else {
                    missionsObj = row.missions;
                }
                
                if (missionsObj.login) loginCompleted++;
                if (missionsObj.view_product) viewProductCompleted++;
            }
        });
        
        // Water/Fertilizer claimed is tricky since we only store remaining turns, not history of claims.
        // We will just report missions and seeds.
        
        res.json({
            success: true,
            data: {
                date: todayStr,
                quests: {
                    login_completed: loginCompleted,
                    view_product_completed: viewProductCompleted,
                    daily_seed_claimed: seedClaimed
                }
            }
        });
    } catch (error) {
        console.error("Lỗi thống kê quests:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

module.exports = router;
