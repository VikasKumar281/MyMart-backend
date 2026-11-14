import jwt from "jsonwebtoken";
import { authCookieOptions, clearAuthCookieOptions } from "../utils/cookies.js";

// Login Seller : /api/seller/login
export const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });

      res.cookie("sellerToken", token, authCookieOptions());

      return res.json({ success: true, message: "Logged In", token });
    }

    return res.json({ success: false, message: "Invalid Credentials" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Logout Seller : /api/seller/logout
export const sellerLogout = async (req, res) => {
  try {
    res.clearCookie("sellerToken", clearAuthCookieOptions());
    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
