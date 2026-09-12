const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || "cay_canh_bi_mat_123";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "Không tìm thấy Token xác thực!" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn hoặc Token không hợp lệ!" });
        }
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    const role = req.user?.vai_tro || req.user?.role;
    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: "Truy cập bị từ chối: Tài khoản của bạn không có quyền Quản trị viên (Admin)!" });
    }
    next();
};

module.exports = { verifyToken, isAdmin };