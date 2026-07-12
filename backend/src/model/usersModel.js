const pool = require('../db.js');

const findByUsernameOrEmail = async (username, email) => {
    const sql = 'SELECT * FROM users WHERE ten_dang_nhap = ? OR email = ?';
    const [rows] = await pool.execute(sql, [username, email]);
    return rows[0];
};

const findByUsername = async (username) => {
    const sql = 'SELECT * FROM users WHERE ten_dang_nhap = ?';
    const [rows] = await pool.execute(sql, [username]);
    return rows[0];
};

const createUser = async (user) => {
    const sql = 'INSERT INTO users (ten_dang_nhap, mat_khau, email, ho_ten, vai_tro) VALUES (?, ?, ?, ?, ?)';
    
    // Lấy vai_tro từ Controller truyền vào, nếu không truyền mới mặc định là 'khach_hang'
    const role = user.role || 'khach_hang'; 
    
    const [result] = await pool.execute(sql, [
        user.username, 
        user.password, 
        user.email, 
        user.full_name || null, 
        role
    ]);
    return result;
};

module.exports = { findByUsernameOrEmail, findByUsername, createUser };