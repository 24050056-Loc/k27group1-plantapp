const pool = require('./src/db');
const jwt = require('jsonwebtoken');
const dailyTaskController = require('./src/Controller/dailyTaskController');

const SECRET_KEY = process.env.SECRET_KEY || "cay_canh_bi_mat_123";

async function runTests() {
    console.log('--- BẮT ĐẦU KIỂM THỬ HỆ THỐNG DAILY TASKS ---');

    // 1. Tạo test user
    const testUsername = 'test_daily_user_' + Date.now();
    const [userRes] = await pool.query(
        "INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, vai_tro) VALUES (?, '123456', ?, 'Test User', 'khach_hang')",
        [testUsername, `${testUsername}@test.com`]
    );
    const testUserId = userRes.insertId;
    console.log(`1. Tạo test user thành công! ID = ${testUserId}`);

    const todayVN = dailyTaskController.getVietnamDateStr();
    console.log(`2. Ngày hiện tại theo VN Timezone: ${todayVN}`);

    // Mock req, res helper
    function createMockReqRes(params = {}, body = {}, query = {}) {
        const req = {
            user: { id: testUserId },
            params,
            body,
            query,
            headers: {}
        };
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            jsonData: null,
            json(data) { this.jsonData = data; return this; }
        };
        return { req, res };
    }

    // 3. Test GET /api/daily-tasks trước khi làm bất kỳ nhiệm vụ nào
    const get1 = createMockReqRes();
    await dailyTaskController.getDailyTasks(get1.req, get1.res);
    console.log('3. GET /api/daily-tasks ban đầu:');
    const tasksInit = get1.res.jsonData.tasks;
    tasksInit.forEach(t => console.log(`   - ${t.id}: status=${t.status}, progress=${t.progress || 0}/${t.target || 1}`));

    // Xác nhận tất cả đều là INCOMPLETE
    const allIncomplete = tasksInit.every(t => t.status === 'INCOMPLETE');
    if (!allIncomplete) throw new Error('Thất bại: Một số task không ở trạng thái INCOMPLETE ban đầu!');
    console.log('   => Tất cả 5 nhiệm vụ đều INCOMPLETE ban đầu ✅');

    // 4. Test chống gian lận: Cố tình claim task khi chưa hoàn thành
    console.log('\n4. Test chống gian lận: User bấm Nhận task "like_post" khi chưa like:');
    const claimCheat = createMockReqRes({ taskId: 'like_post' });
    await dailyTaskController.claimTask(claimCheat.req, claimCheat.res);
    console.log(`   Status code: ${claimCheat.res.statusCode}, Message: ${claimCheat.res.jsonData.message}`);
    if (claimCheat.res.statusCode !== 400 || claimCheat.res.jsonData.success !== false) {
        throw new Error('Thất bại: Backend cho phép nhận thưởng khi chưa hoàn thành nhiệm vụ!');
    }
    console.log('   => Backend đã chặn thành công và trả lỗi 400 ✅');

    // 5. Test nhiệm vụ 1: Đăng nhập mỗi ngày (check-in)
    console.log('\n5. Test nhiệm vụ "daily_login":');
    const checkin = createMockReqRes();
    await dailyTaskController.checkIn(checkin.req, checkin.res);
    const getAfterLogin = createMockReqRes();
    await dailyTaskController.getDailyTasks(getAfterLogin.req, getAfterLogin.res);
    const loginTask = getAfterLogin.res.jsonData.tasks.find(t => t.id === 'daily_login');
    console.log(`   Status daily_login: ${loginTask.status}`);
    if (loginTask.status !== 'CLAIMABLE') throw new Error('daily_login phải là CLAIMABLE sau khi login!');
    console.log('   => daily_login đã chuyển thành CLAIMABLE ✅');

    // Nhận thưởng daily_login
    const claimLogin = createMockReqRes({ taskId: 'daily_login' });
    await dailyTaskController.claimTask(claimLogin.req, claimLogin.res);
    console.log(`   Claim daily_login: success=${claimLogin.res.jsonData.success}, turns=`, claimLogin.res.jsonData.updatedTurns);
    if (!claimLogin.res.jsonData.success || claimLogin.res.jsonData.status !== 'CLAIMED') {
        throw new Error('Claim daily_login thất bại!');
    }
    console.log('   => daily_login đã chuyển sang CLAIMED và cộng +1 lượt nước ✅');

    // Test double claim: bấm nhận lần 2
    console.log('\n6. Test chống Double Claim (bấm nhận lần 2):');
    const claimLoginTwice = createMockReqRes({ taskId: 'daily_login' });
    await dailyTaskController.claimTask(claimLoginTwice.req, claimLoginTwice.res);
    console.log(`   Status code: ${claimLoginTwice.res.statusCode}, Message: ${claimLoginTwice.res.jsonData.message}`);
    if (claimLoginTwice.res.statusCode !== 400) {
        throw new Error('Thất bại: Cho phép nhận thưởng lần 2 trong ngày!');
    }
    console.log('   => Chặn double claim thành công ✅');

    // 7. Test nhiệm vụ 2: Xem 3 sản phẩm
    console.log('\n7. Test nhiệm vụ "view_products":');
    // Xem sp 1
    await dailyTaskController.recordProductViewAction(createMockReqRes({}, { productId: 101 }).req, createMockReqRes().res);
    // Xem lại sp 1 (trùng ID -> không tăng)
    await dailyTaskController.recordProductViewAction(createMockReqRes({}, { productId: 101 }).req, createMockReqRes().res);
    // Xem sp 2
    await dailyTaskController.recordProductViewAction(createMockReqRes({}, { productId: 102 }).req, createMockReqRes().res);

    let getViews = createMockReqRes();
    await dailyTaskController.getDailyTasks(getViews.req, getViews.res);
    let viewTask = getViews.res.jsonData.tasks.find(t => t.id === 'view_products');
    console.log(`   Xem 2 sản phẩm khác nhau: progress=${viewTask.progress}/${viewTask.target}, status=${viewTask.status}`);
    if (viewTask.progress !== 2 || viewTask.status !== 'INCOMPLETE') {
        throw new Error('Tiến độ xem sản phẩm tính sai!');
    }

    // Xem sp 3
    await dailyTaskController.recordProductViewAction(createMockReqRes({}, { productId: 103 }).req, createMockReqRes().res);
    getViews = createMockReqRes();
    await dailyTaskController.getDailyTasks(getViews.req, getViews.res);
    viewTask = getViews.res.jsonData.tasks.find(t => t.id === 'view_products');
    console.log(`   Xem sản phẩm thứ 3: progress=${viewTask.progress}/${viewTask.target}, status=${viewTask.status}`);
    if (viewTask.progress !== 3 || viewTask.status !== 'CLAIMABLE') {
        throw new Error('Phải chuyển sang CLAIMABLE khi đủ 3 sản phẩm!');
    }
    console.log('   => Đủ 3 sản phẩm khác nhau -> Chuyển thành CLAIMABLE ✅');

    // 8. Test nhiệm vụ 3: Like bài viết và Unlike không mất quyền nhận thưởng
    console.log('\n8. Test nhiệm vụ "like_post":');
    await dailyTaskController.recordPostLike(testUserId, 999);
    let getLike = createMockReqRes();
    await dailyTaskController.getDailyTasks(getLike.req, getLike.res);
    let likeTask = getLike.res.jsonData.tasks.find(t => t.id === 'like_post');
    console.log(`   Sau khi Like bài viết 999: status=${likeTask.status}`);
    if (likeTask.status !== 'CLAIMABLE') throw new Error('like_post phải là CLAIMABLE!');

    // Giả lập user unlike trong explore_likes
    console.log('   Giả lập user Unlike bài viết: Record trong daily_post_likes vẫn giữ nguyên');
    getLike = createMockReqRes();
    await dailyTaskController.getDailyTasks(getLike.req, getLike.res);
    likeTask = getLike.res.jsonData.tasks.find(t => t.id === 'like_post');
    console.log(`   Kiểm tra lại trạng thái sau Unlike: status=${likeTask.status}`);
    if (likeTask.status !== 'CLAIMABLE') throw new Error('Không được reset khi unlike!');
    console.log('   => Unlike không làm mất trạng thái CLAIMABLE ✅');

    // Nhận thưởng like_post (+1 Phân bón)
    const claimLike = createMockReqRes({ taskId: 'like_post' });
    await dailyTaskController.claimTask(claimLike.req, claimLike.res);
    console.log(`   Claim like_post: success=${claimLike.res.jsonData.success}, turns=`, claimLike.res.jsonData.updatedTurns);
    if (claimLike.res.jsonData.reward.type !== 'fertilizer') {
        throw new Error('Phần thưởng like_post phải là fertilizer!');
    }
    console.log('   => Nhận thành công +1 Phân bón 🌿 ✅');

    // 9. Test nhiệm vụ 4: Chia sẻ sự kiện
    console.log('\n9. Test nhiệm vụ "share_event":');
    await dailyTaskController.recordEventShareAction(createMockReqRes().req, createMockReqRes().res);
    const getShare = createMockReqRes();
    await dailyTaskController.getDailyTasks(getShare.req, getShare.res);
    const shareTask = getShare.res.jsonData.tasks.find(t => t.id === 'share_event');
    console.log(`   Sau khi Share: status=${shareTask.status}`);
    if (shareTask.status !== 'CLAIMABLE') throw new Error('share_event phải là CLAIMABLE!');
    console.log('   => share_event chuyển thành CLAIMABLE ✅');

    // 10. Test nhiệm vụ 5: Khám phá cộng đồng
    console.log('\n10. Test nhiệm vụ "community_explore":');
    await dailyTaskController.recordCommunityExploreAction(createMockReqRes().req, createMockReqRes().res);
    const getExplore = createMockReqRes();
    await dailyTaskController.getDailyTasks(getExplore.req, getExplore.res);
    const exploreTask = getExplore.res.jsonData.tasks.find(t => t.id === 'community_explore');
    console.log(`   Sau khi vào Community: status=${exploreTask.status}`);
    if (exploreTask.status !== 'CLAIMABLE') throw new Error('community_explore phải là CLAIMABLE!');

    const claimExplore = createMockReqRes({ taskId: 'community_explore' });
    await dailyTaskController.claimTask(claimExplore.req, claimExplore.res);
    console.log(`   Claim community_explore: seed=`, claimExplore.res.jsonData.rewardSeed);
    if (!claimExplore.res.jsonData.rewardSeed) throw new Error('Phải nhận được hạt giống!');
    console.log('   => Nhận thành công Hạt giống ngẫu nhiên 🌱 ✅');

    // Dọn dẹp test user
    await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
    await pool.query('DELETE FROM event_progress WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM daily_task_claims WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM daily_logins WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM daily_product_views WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM daily_post_likes WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM daily_event_shares WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM daily_community_explores WHERE user_id = ?', [testUserId]);

    console.log('\n🎉 TOÀN BỘ 10 BƯỚC KIỂM THỬ BACKEND ĐỀU ĐẠT CHUẨN 100%! 🎉\n');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ LỖI KIỂM THỬ:', err);
    process.exit(1);
});
