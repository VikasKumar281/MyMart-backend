import express from "express";
import { sellerLogin, sellerLogout, isSellerAuth } from "../controllers/sellerController.js";
import authSeller from "../middlewares/authSeller.js";

const sellerRouter = express.Router();

sellerRouter.post("/login", sellerLogin);
sellerRouter.get("/is-auth", authSeller, isSellerAuth);
sellerRouter.post("/logout", sellerLogout);

export default sellerRouter;
