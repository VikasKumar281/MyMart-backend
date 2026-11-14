import express from "express";
import authUser from "../middlewares/authUser.js";
import { getAllOrders, getUserOrders, paymentMode, placeOrderCOD, placeOrderStripe, placeOrderTest, verifyStripe } from "../controllers/orderController.js";
import authSeller from "../middlewares/authSeller.js";

const orderRouter = express.Router();

orderRouter.get("/payment-mode", paymentMode);
orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.post("/pay-test", authUser, placeOrderTest);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/verify-stripe", authUser, verifyStripe);
orderRouter.get("/user", authUser, getUserOrders);
orderRouter.get("/seller", authSeller, getAllOrders);

export default orderRouter;
