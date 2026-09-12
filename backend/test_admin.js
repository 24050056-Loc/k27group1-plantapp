const http = require('http');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "cay_canh_bi_mat_123";

const token = jwt.sign(
    { id: 1, role: 'admin' },
    SECRET_KEY,
    { expiresIn: '24h' }
);

function get(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if(res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
                } else {
                    reject(`HTTP ${res.statusCode}: ${data}`);
                }
            });
        });

        req.on('error', error => { reject(error); });
        req.end();
    });
}

(async () => {
    try {
        console.log("1. Testing Dashboard Stats...");
        const stats = await get('/api/admin_dashboard/stats');
        console.log("Stats:", JSON.stringify(stats).substring(0, 100));

        console.log("2. Testing Users list...");
        const users = await get('/api/admin/users?limit=2');
        console.log("Users total:", users.total);
        
        console.log("3. Testing Event Stats...");
        const events = await get('/api/admin/events/stats');
        console.log("Events:", JSON.stringify(events).substring(0, 100));
        
        console.log("4. Testing Quests Stats...");
        const quests = await get('/api/admin/quests/stats');
        console.log("Quests:", JSON.stringify(quests).substring(0, 100));

        console.log("\nALL BACKEND APIS TESTED OK ✅");
    } catch (e) {
        console.error("Test failed:", e);
    }
})();
