export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

export const clearAuthCookieOptions = () => {
  const { maxAge, ...options } = authCookieOptions();
  return options;
};

export const readUserToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
};

export const readSellerToken = (req) => {
  if (req.cookies?.sellerToken) return req.cookies.sellerToken;
  const header = req.headers["x-seller-token"];
  return typeof header === "string" && header.trim() ? header.trim() : null;
};
