const pool = require('../db.js');

const createProduct = async (productData) => {
    // Dùng await và pool.execute để đồng bộ với các file khác của bạn
    const sql = `INSERT INTO products (name, gia_tien, description, stock, category_id) VALUES (?, ?, ?, ?, ?)`;
    const values = [
        productData.name, 
        productData.gia_tien, 
        productData.description, 
        productData.stock, 
        productData.category_id,
    ];

    const [result] = await pool.execute(sql, values);
    return result;
};

module.exports = {
    createProduct
};