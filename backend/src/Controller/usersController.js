const userModel = require('../model/usersModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');

const SECRET_KEY = process.env.SECRET_KEY || "cay_canh_bi_mat_123";

const register = async (req, res) => {
    try {
        // Đổi các biến sang tiếng Việt cho khớp với Database
        const { ten_dang_nhap, mat_khau, email, ho_ten, so_dien_thoai, dia_chi } = req.body;

        if (!ten_dang_nhap || !mat_khau || !email) {
            return res.status(400).json({ message: "Vui lòng nhập đủ: Tài khoản, Mật khẩu và Email!" });
        }

        // 1. Kiểm tra tài khoản hoặc email đã tồn tại chưa (truyền biến tiếng Việt vào model)
        const existingUser = await userModel.findByUsernameOrEmail(ten_dang_nhap, email);
        if (existingUser) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc Email đã tồn tại!" });
        }

        // 2. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(mat_khau, 10);

        // 3. Lưu vào database (gửi các trường tiếng Việt xuống Model)
        await userModel.createUser({
            ten_dang_nhap,
            email,
            mat_khau: hashedPassword,
            ho_ten,
            so_dien_thoai,
            dia_chi
        });

        res.status(201).json({ success: true, message: "Đăng ký thành công!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validate dữ liệu đầu vào cơ bản
        if (!username || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu!" });
        }

        // 2. Tìm user trong Database theo tên đăng nhập
        const users = await userModel.findByUsername(username);
        
        // BƯỚC SỬA LỖI: Kiểm tra xem user có tồn tại trong hệ thống hay không
        if (!user) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        // 3. Kiểm tra xem tài khoản có đang bị khóa (dang_hoat_dong = 0) không
        if (!users.dang_hoat_dong) {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa!" });
        }

        // 4. So sánh mật khẩu (Chỉ chạy khi chắc chắn 'user' đã tồn tại)
        // Lưu ý: user.mat_khau khớp với tên cột tiếng Việt trong DB của bạn
        const isMatch = await bcrypt.compare(password, user.mat_khau);
        if (!isMatch) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        // 5. Tạo JWT Token (Nếu đăng nhập thành công)
        // Chỗ này gom thông tin để lưu vào token
        const token = jwt.sign(
            { id: users.id, vai_tro: users.vai_tro },
            process.env.SECRET_KEY,
            { expiresIn: '1d' } // Token có hiệu lực 1 ngày
        );

        // 6. Trả về kết quả cho Frontend
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            token,
            user: {
                id: users.id,
                ten_dang_nhap: users.ten_dang_nhap,
                ho_ten: users.ho_ten,
                vai_tro: users.vai_tro
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

module.exports = { register, login };