"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRequest = exports.sendStripePublishableRequest = exports.getAllOrder = exports.createOrder = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const userModel_1 = require("../model/userModel");
const cousreModel_1 = __importDefault(require("../model/cousreModel"));
const orderService_1 = require("../services/orderService");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notificationModel_1 = __importDefault(require("../model/notificationModel"));
const redis_1 = require("../utils/redis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// create order
exports.createOrder = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== 'succeeded') {
                    return next(new ErrorHandler_1.default("Payment not authorized!", 400));
                }
            }
        }
        const user = await userModel_1.User.findById(req.user?._id);
        // check user purschased this course already
        const courseExist = user?.courses.some((cousre) => cousre._id.toString() == courseId);
        if (courseExist) {
            return next(new ErrorHandler_1.default("You already purschased this course", 400));
        }
        const course = await cousreModel_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not Found", 400));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_info
        };
        //send mail to notify you create order
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: "numeric"
                })
            }
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, '../mails/order.ejs'), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order.ejs",
                    data: mailData
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
        // push cousreId into userCousre
        user?.courses.push(course._id);
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();
        // create notification
        await notificationModel_1.default.create({
            userId: user?._id,
            title: "New Order",
            message: `You have  a new order from ${course?.name}`
        });
        if (course.purchased) {
            course.purchased += 1;
        }
        else {
            course.purchased = 1;
        }
        await course?.save();
        // used another componnet in service
        (0, orderService_1.orderService)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all orders -- only admin
exports.getAllOrder = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        (0, orderService_1.getAllOrders)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//  send stripe publishable request for fronted
exports.sendStripePublishableRequest = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});
// new payment request
exports.paymentRequest = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const myPaymentRequest = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: 'USD',
            metadata: {
                company: 'SmartStudy',
            },
            automatic_payment_methods: {
                enabled: true,
            }
        });
        res.status(201).json({
            success: true,
            client_secret: myPaymentRequest.client_secret
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
