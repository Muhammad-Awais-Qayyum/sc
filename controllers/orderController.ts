import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../middleware/catchAsync";
import ErrorHandler from "../ErrorHandler";
import { IOrder } from "../model/orderModel";
import { User } from "../model/userModel";
import Course from "../model/cousreModel";
import { getAllOrders, orderService } from "../services/orderService";
import ejs from 'ejs'
import path from "path";
import sendMail from "../utils/sendMail";
import Notification from "../model/notificationModel";
import { redis } from "../utils/redis";
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// create order

export const createOrder = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;

        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id
                const paymentIntent = await stripe.paymentIntents.retrieve(
                    paymentIntentId
                )

                if (paymentIntent.status !== 'succeeded') {
                    return next(new ErrorHandler("Payment not authorized!", 400))
                }
            }

        }

        const user = await User.findById(req.user?._id);

        // check user purschased this course already

        const courseExist = user?.courses.some((cousre: any) =>
            cousre._id.toString() == courseId
        )

        if (courseExist) {
            return next(new ErrorHandler("You already purschased this course", 400))
        }

        const course = await Course.findById(courseId)

        if (!course) {
            return next(new ErrorHandler("Course not Found", 400))
        }

        const data: any = {
            courseId: course._id,
            userId: user?._id,
            payment_info
        }



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
        }

        const html = await ejs.renderFile(path.join(__dirname, '../mails/order.ejs'), { order: mailData })

        try {
            if (user) {
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order.ejs",
                    data: mailData
                })
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500))

        }

        // push cousreId into userCousre
        user?.courses.push(course._id)
        await redis.set(req.user?._id, JSON.stringify(user))

        await user?.save();


        // create notification

        await Notification.create({
            userId: user?._id,
            title: "New Order",
            message: `You have  a new order from ${course?.name}`
        })

        if (course.purchased) {
            course.purchased += 1;
        } else {
            course.purchased = 1;
        }

        await course?.save()
        // used another componnet in service
        orderService(data, res, next)

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})



// get all orders -- only admin

export const getAllOrder = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllOrders(res)

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


//  send stripe publishable request for fronted


export const sendStripePublishableRequest = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    })
})


// new payment request


export const paymentRequest = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})