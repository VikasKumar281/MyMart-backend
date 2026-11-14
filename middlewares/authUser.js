import jwt from "jsonwebtoken";
import { readUserToken } from "../utils/cookies.js";

const authUser = async (req, res, next) => {
  const token = readUserToken(req);

  if (!token) {
    return res.json({ success: false, message: "Not Authorized" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode.id) {
      return res.json({ success: false, message: "Not Authorized" });
    }

    req.userId = tokenDecode.id;
    req.body = req.body || {};
    req.body.userId = tokenDecode.id;
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
