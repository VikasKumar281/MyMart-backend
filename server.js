import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import connectCloudinary from "./configs/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://mymart-bay.vercel.app",
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(","),
]
  .map((origin) => origin && origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || uniqueOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-seller-token"],
  })
);

let readyPromise;
const ensureReady = () => {
  if (!readyPromise) {
    readyPromise = Promise.all([connectDB(), connectCloudinary()]).catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
};

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/", (req, res) => res.send("API is Working"));
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
