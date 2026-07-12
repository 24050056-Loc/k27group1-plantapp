const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || "cay_canh_123";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ message: "Không tìm thấy Token!" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Phiên đăng nhập hết hạn!" });
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Bạn không có quyền Admin!" });
    }
    next();
};

module.exports = { verifyToken, isAdmin };