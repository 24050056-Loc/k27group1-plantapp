const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // 1. Lấy token từ header 'Authorization'
    const authHeader = req.headers['authorization'];
    // Định dạng token frontend gửi lên thường là: "Bearer <chuỗi_token>"
    let token = authHeader && authHeader.split(' ')[1];

    // Xóa dấu ngoặc kép nếu có (do localStorage.setItem đôi khi lưu string có quotes)
    if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
    }

    // 2. Kiểm tra xem có token không
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Từ chối truy cập! Bạn chưa đăng nhập." 
        });
    }

    // 3. Lấy secret key (khóa bí mật) từ file .env
    // Đảm bảo JWT_SECRET giống hệt với lúc bạn tạo token ở API Đăng nhập
    const secretKey = process.env.SECRET_KEY || 'YOUR_SECRET_KEY';

    // 4. Xác thực token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: "Token không hợp lệ hoặc đã hết hạn phiên đăng nhập!" 
            });
        }

        // 5. Giải mã thành công, lưu thông tin user (ví dụ: id) vào request
        req.user = decoded;
        
        // 6. Cho phép đi tiếp vào hàm xử lý API (như checkout)
        next();
    });
};

module.exports = authenticateToken;