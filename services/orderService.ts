import { NextFunction, Response } from "express";

import { CatchAsync } from "../middleware/catchAsync";
import Order from "../model/orderModel";



export const orderService = CatchAsync(async (data: any, res: Response) => {
    const order = await Order.create(data);
    res.status(200).json({
        success: true,
        order
    })
})

// get all users
export const getAllOrders = async (res: Response) => {
    const orders = await Order.find().sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        orders
    })
}