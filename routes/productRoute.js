import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import { addProduct, changeStock, productById, productList, sellerProductList } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.post("/add", authSeller, (req, res, next) => {
  upload.array("images", 4)(req, res, (error) => {
    if (error) return res.json({ success: false, message: error.message });
    next();
  });
}, addProduct);
productRouter.get("/list", productList);
productRouter.get("/seller", authSeller, sellerProductList);
productRouter.get("/id", productById);
productRouter.post("/stock", authSeller, changeStock);

export default productRouter;
