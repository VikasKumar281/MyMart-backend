import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authCookieOptions, clearAuthCookieOptions } from "../utils/cookies.js";

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  cartItems: user.cartItems || {},
});

const signUser = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Register User : /api/user/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = signUser(user);

    res.cookie("token", token, authCookieOptions());

    return res.json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Login User : /api/user/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const token = signUser(user);
    res.cookie("token", token, authCookieOptions());

    return res.json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Logout User : /api/user/logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", clearAuthCookieOptions());
    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
