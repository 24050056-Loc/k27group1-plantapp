const pool = require('../db'); // Giả sử bạn đã cấu hình file db.js để kết nối MySQL

const productController = {
    // 1. API CHO TRANG SẢN PHẨM (Lấy TẤT CẢ cây)
    getAllProducts: async (req, res) => {
        try {
            const query = `SELECT * FROM products ORDER BY gia_tien DESC`;
            const [rows] = await pool.execute(query);
            res.json(rows);
        } catch (error) {
            console.error("Lỗi lấy tất cả sản phẩm:", error);
            res.status(500).json({ message: "Lỗi lấy dữ liệu sản phẩm" });
        }
    },

    // 2. API CHO TRANG CHỦ (Chỉ lấy Top 6 cây)
    getFeaturedProducts: async (req, res) => {
        try {
            const query = `SELECT * FROM products ORDER BY gia_tien DESC LIMIT 6`;
            const [rows] = await pool.execute(query);
            res.json(rows);
        } catch (error) {
            console.error("Lỗi lấy 6 sản phẩm:", error);
            res.status(500).json({ message: "Lỗi lấy dữ liệu sản phẩm" });
        }
    },

    // 3. Admin: Thêm sản phẩm mới
    addPlant: async (req, res) => {
        const { ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh } = req.body;
        try {
            const query = `
                INSERT INTO products 
                (ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.execute(query, [
                ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh
            ]);
            res.status(201).json({ id: result.insertId, message: "Thêm sản phẩm thành công" });
        } catch (error) {
            console.error("Lỗi thêm sản phẩm:", error);
            res.status(500).json({ message: "Lỗi khi thêm sản phẩm vào hệ thống" });
        }
    },

    // 4. Admin: Cập nhật sản phẩm
    updatePlant: async (req, res) => {
        const { id } = req.params;
        const { ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh } = req.body;
        try {
            const query = `
                UPDATE products 
                SET ten_san_pham=?, gia_tien=?, so_luong_kho=?, category_id=?, hinh_anh_url=?, dang_kinh_doanh=? 
                WHERE id=?
            `;
            await pool.execute(query, [
                ten_san_pham, gia_tien, so_luong_kho, category_id, hinh_anh_url, dang_kinh_doanh, id
            ]);
            res.json({ message: "Cập nhật sản phẩm thành công" });
        } catch (error) {
            console.error("Lỗi cập nhật sản phẩm:", error);
            res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm" });
        }
    },

    // 5. Admin: Xóa sản phẩm
    deletePlant: async (req, res) => {
        const { id } = req.params;
        try {
            const query = `DELETE FROM products WHERE id=?`;
            await pool.execute(query, [id]);
            res.json({ message: "Xóa sản phẩm thành công" });
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error);
            res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
        }
    }
};

module.exports = productController;