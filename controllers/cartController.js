import User from "../models/User.js";

// Update User CartData : /api/cart/update
export const updateCart = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { cartItems } = req.body;

    if (!cartItems || typeof cartItems !== "object" || Array.isArray(cartItems)) {
      return res.json({ success: false, message: "Invalid cart data" });
    }

    await User.findByIdAndUpdate(userId, { cartItems });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
