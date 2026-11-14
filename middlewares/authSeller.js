import jwt from "jsonwebtoken";
import { readSellerToken } from "../utils/cookies.js";

const authSeller = async (req, res, next) => {
  const sellerToken = readSellerToken(req);

  if (!sellerToken) {
    return res.json({ success: false, message: "Not Authorized" });
  }

  try {
    const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);

    if (tokenDecode.email === process.env.SELLER_EMAIL) {
      next();
    } else {
      return res.json({ success: false, message: "Not Authorized" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authSeller;
