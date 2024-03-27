"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.orderService = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const orderModel_1 = __importDefault(require("../model/orderModel"));
exports.orderService = (0, catchAsync_1.CatchAsync)(async (data, res) => {
    const order = await orderModel_1.default.create(data);
    res.status(200).json({
        success: true,
        order
    });
});
// get all users
const getAllOrders = async (res) => {
    const orders = await orderModel_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        orders
    });
};
exports.getAllOrders = getAllOrders;
