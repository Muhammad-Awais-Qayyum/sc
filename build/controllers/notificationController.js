"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getNotification = void 0;
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const catchAsync_1 = require("../middleware/catchAsync");
const notificationModel_1 = __importDefault(require("../model/notificationModel"));
const node_cron_1 = __importDefault(require("node-cron"));
// get all notification -- its for admin only
exports.getNotification = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const notification = await notificationModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notification
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update notification -- only admin dashboard
exports.updateNotification = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const notification = await notificationModel_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", 400));
        }
        else {
            notification.status ? notification.status = 'read' : notification.status;
        }
        await notification.save();
        const notify = await notificationModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notify
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delelte notification automatically certain time -- only admin
node_cron_1.default.schedule("0 0 0 * * * ", async () => {
    const thrirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notificationModel_1.default.deleteMany({ status: "read", createdAt: { $lt: thrirtyDaysAgo } });
});
