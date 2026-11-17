import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authCookieOptions, clearAuthCookieOptions } from "../utils/cookies.js";

// Login Seller : /api/seller/login
export const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

        const user = await User.findOne({ email });
        const userMatch = user && (await bcrypt.compare(password, user.password));
        const adminMatch = password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL;

        if (!userMatch && !adminMatch) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }

        const token = jwt.sign(
            {
                email,
                id: userMatch ? String(user._id) : "",
                role: adminMatch ? "admin" : "seller",
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("sellerToken", token, authCookieOptions());
        return res.json({ success: true, message: "Logged In", token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
  try {
        return res.json({ success: true, email: req.seller?.email || "" });
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
