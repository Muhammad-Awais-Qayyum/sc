import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../ErrorHandler";
import { CatchAsync } from "../middleware/catchAsync";
import Notification from "../model/notificationModel";
import cron from 'node-cron'


// get all notification -- its for admin only
export const getNotification = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = await Notification.find().sort({ createdAt: -1 })


        res.status(200).json({
            success: true,
            notification
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// update notification -- only admin dashboard


export const updateNotification = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = await Notification.findById(req.params.id)
        if (!notification) {
            return next(new ErrorHandler("Notification not found", 400))
        } else {
            notification.status ? notification.status = 'read' : notification.status
        }

        await notification.save()

        const notify = await Notification.find().sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            notify
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// delelte notification automatically certain time -- only admin


cron.schedule("0 0 0 * * * ", async () => {
    const thrirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    await Notification.deleteMany({ status: "read", createdAt: { $lt: thrirtyDaysAgo } })
})