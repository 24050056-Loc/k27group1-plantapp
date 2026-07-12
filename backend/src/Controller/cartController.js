const cartModel = require('./model/cartModel');
const pool = require('../db.js');

const viewCart = async (req, res) => {
    try {
        // req.user.id được lấy ra từ middleware verifyToken (khi khách đã đăng nhập)
        const userId = req.user.id; 
        
        const cartItems = await cartModel.getCartByUserId(userId);
        res.status(200).json({ cart: cartItems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy giỏ hàng!" });
    }
};

const addItemToCart = async (req, res) => {
    try {
        const userId = req.user.id; // Phải đăng nhập mới mua được
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({ message: "Vui lòng chọn sản phẩm và số lượng!" });
        }

        await cartModel.addToCart(userId, product_id, quantity);
        res.status(200).json({ message: "Đã thêm cây vào giỏ hàng!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi thêm vào giỏ hàng!" });
    }
};

module.exports = { viewCart, addItemToCart };