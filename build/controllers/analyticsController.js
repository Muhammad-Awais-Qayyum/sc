"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderAnalytics = exports.getCourseAnalytics = exports.getUserAnalytics = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const analytics_1 = require("../utils/analytics");
const userModel_1 = require("../model/userModel");
const cousreModel_1 = __importDefault(require("../model/cousreModel"));
const orderModel_1 = __importDefault(require("../model/orderModel"));
// get user analytics -- only admin purpose
exports.getUserAnalytics = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const users = await (0, analytics_1.generateLast12MonthsData)(userModel_1.User);
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get course analytics -- only admin purpose
exports.getCourseAnalytics = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const course = await (0, analytics_1.generateLast12MonthsData)(cousreModel_1.default);
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get order analytics -- only admin purpose
exports.getOrderAnalytics = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const order = await (0, analytics_1.generateLast12MonthsData)(orderModel_1.default);
        res.status(200).json({
            success: true,
            order
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
