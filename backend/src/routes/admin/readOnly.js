const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { verifyToken, isAdmin } = require('../../middlewares/authadmin');

// Helper function cho Pagination
const getPaginationParams = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

// GET /api/admin/users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        let search = req.query.search || '';
        
        let queryStr = "SELECT id, ten_dang_nhap, email, ho_ten, so_dien_thoai, vai_tro, dang_hoat_dong, ngay_tao FROM users";
        let countQueryStr = "SELECT COUNT(*) as total FROM users";
        let queryParams = [];
        
        if (search) {
            queryStr += " WHERE ho_ten LIKE ? OR email LIKE ? OR so_dien_thoai LIKE ?";
            countQueryStr += " WHERE ho_ten LIKE ? OR email LIKE ? OR so_dien_thoai LIKE ?";
            const searchParam = `%${search}%`;
            queryParams = [searchParam, searchParam, searchParam];
        }
        
        queryStr += " ORDER BY ngay_tao DESC LIMIT ? OFFSET ?";
        
        const [users] = await pool.query(queryStr, [...queryParams, limit, offset]);
        const [[{ total }]] = await pool.query(countQueryStr, queryParams);
        
        res.json({
            success: true,
            data: users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách users:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// GET /api/admin/products
router.get('/products', verifyToken, isAdmin, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        let search = req.query.search || '';
        
        let queryStr = `
            SELECT p.id, p.ten_san_pham, p.gia_tien, p.so_luong_kho, p.dang_kinh_doanh, p.ngay_tao, p.hinh_anh_url, c.ten_danh_muc 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        let countQueryStr = "SELECT COUNT(*) as total FROM products";
        let queryParams = [];
        
        if (search) {
            queryStr += " WHERE p.ten_san_pham LIKE ?";
            countQueryStr += " WHERE ten_san_pham LIKE ?";
            queryParams = [`%${search}%`];
        }
        
        queryStr += " ORDER BY p.ngay_tao DESC LIMIT ? OFFSET ?";
        
        const [products] = await pool.query(queryStr, [...queryParams, limit, offset]);
        const [[{ total }]] = await pool.query(countQueryStr, queryParams);
        
        res.json({
            success: true,
            data: products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách products:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// GET /api/admin/orders
router.get('/orders', verifyToken, isAdmin, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        let status = req.query.status || '';
        let search = req.query.search || '';
        
        let queryStr = `
            SELECT o.id, o.tong_tien_hang, o.so_tien_giam_gia, o.tong_thanh_toan, o.trang_thai, o.ngay_dat_hang, o.ma_giam_gia,
                   u.ho_ten as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        let countQueryStr = "SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1";
        let queryParams = [];
        
        if (status) {
            queryStr += " AND o.trang_thai = ?";
            countQueryStr += " AND o.trang_thai = ?";
            queryParams.push(status);
        }
        
        if (search) {
            queryStr += " AND (o.id = ? OR u.ho_ten LIKE ?)";
            countQueryStr += " AND (o.id = ? OR u.ho_ten LIKE ?)";
            queryParams.push(search, `%${search}%`);
        }
        
        queryStr += " ORDER BY o.ngay_dat_hang DESC LIMIT ? OFFSET ?";
        
        const [orders] = await pool.query(queryStr, [...queryParams, limit, offset]);
        const [[{ total }]] = await pool.query(countQueryStr, queryParams);
        
        res.json({
            success: true,
            data: orders,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách orders:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// GET /api/admin/vouchers
router.get('/vouchers', verifyToken, isAdmin, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        let status = req.query.status || '';
        
        let queryStr = `
            SELECT uc.id, uc.code, uc.label, uc.discount_type, uc.discount_value, uc.source_stage, uc.status, uc.created_at, uc.expires_at, uc.used_at, uc.used_order_id,
                   u.ho_ten as user_name, u.email as user_email
            FROM user_coupons uc
            LEFT JOIN users u ON uc.user_id = u.id
            WHERE 1=1
        `;
        let countQueryStr = "SELECT COUNT(*) as total FROM user_coupons uc WHERE 1=1";
        let queryParams = [];
        
        if (status) {
            queryStr += " AND uc.status = ?";
            countQueryStr += " AND uc.status = ?";
            queryParams.push(status);
        }
        
        queryStr += " ORDER BY uc.created_at DESC LIMIT ? OFFSET ?";
        
        const [vouchers] = await pool.query(queryStr, [...queryParams, limit, offset]);
        const [[{ total }]] = await pool.query(countQueryStr, queryParams);
        
        res.json({
            success: true,
            data: vouchers,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách vouchers:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

module.exports = router;
