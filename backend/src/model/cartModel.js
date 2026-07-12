const pool = require('../db.js');

const getCartByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        // JOIN bảng giỏ hàng với bảng sản phẩm để lấy ra tên và giá cây cảnh
        const sql = `
            SELECT c.id, c.product_id, c.quantity, p.name, p.price, (c.quantity * p.price) as total_price
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;
        pool.query(sql, [userId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const addToCart = (userId, productId, quantity) => {
    return new Promise((resolve, reject) => {
        // Kiểm tra xem sản phẩm đã có trong giỏ chưa
        const checkSql = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?';
        pool.query(checkSql, [userId, productId], (err, results) => {
            if (err) return reject(err);

            if (results.length > 0) {
                // Nếu có rồi thì cộng thêm số lượng
                const updateSql = 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?';
                pool.query(updateSql, [quantity, results[0].id], (err, updateResult) => {
                    if (err) return reject(err);
                    resolve(updateResult);
                });
            } else {
                // Nếu chưa có thì thêm mới
                const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
                pool.query(insertSql, [userId, productId, quantity], (err, insertResult) => {
                    if (err) return reject(err);
                    resolve(insertResult);
                });
            }
        });
    });
};

module.exports = { getCartByUserId, addToCart };