import express from "express";
import { sellerLogin, sellerLogout, isSellerAuth } from "../controllers/sellerController.js";

const sellerRouter = express.Router();

sellerRouter.post("/login", sellerLogin);
sellerRouter.get("/is-auth", isSellerAuth);
sellerRouter.post("/logout", sellerLogout);

export default sellerRouter;