import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/protectedRoute";
import {
    createOrder,
    getAllOrder,
    paymentRequest,
    sendStripePublishableRequest,
} from "../controllers/orderController";
import { AccessToken } from "../controllers/userController";

const orderrouter = express.Router();

orderrouter.post("/create-order", AccessToken, isAutheticated, createOrder);
orderrouter.get(
    "/get-all-order",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    getAllOrder
);

orderrouter.get("/payment/publishable", sendStripePublishableRequest);

orderrouter.post("/payment", AccessToken,isAutheticated, paymentRequest);
export default orderrouter;
