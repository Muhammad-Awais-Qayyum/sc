
import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../middleware/catchAsync";
import ErrorHandler from "../ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics";
import { User } from "../model/userModel";
import Course from "../model/cousreModel";
import Order from "../model/orderModel";






// get user analytics -- only admin purpose

export const getUserAnalytics = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await generateLast12MonthsData(User);

        res.status(200).json({
            success: true,
            users
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// get course analytics -- only admin purpose

export const getCourseAnalytics = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const course = await generateLast12MonthsData(Course);

        res.status(200).json({
            success: true,
            course
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})




// get order analytics -- only admin purpose

export const getOrderAnalytics = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await generateLast12MonthsData(Order);

        res.status(200).json({
            success: true,
            order
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})