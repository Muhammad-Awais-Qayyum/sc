"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectedRoute_1 = require("../middleware/protectedRoute");
const orderController_1 = require("../controllers/orderController");
const userController_1 = require("../controllers/userController");
const orderrouter = express_1.default.Router();
orderrouter.post("/create-order", userController_1.AccessToken, protectedRoute_1.isAutheticated, orderController_1.createOrder);
orderrouter.get("/get-all-order", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), orderController_1.getAllOrder);
orderrouter.get("/payment/publishable", orderController_1.sendStripePublishableRequest);
orderrouter.post("/payment", userController_1.AccessToken, protectedRoute_1.isAutheticated, orderController_1.paymentRequest);
exports.default = orderrouter;
