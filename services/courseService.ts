import { NextFunction, Response } from "express"
import { CatchAsync } from "../middleware/catchAsync"
import Course from "../model/cousreModel"



export const createCourse = CatchAsync(async (data: any, res: Response) => {
    const course = await Course.create(data)


    res.status(201).json({
        success: true,
        course
    })

})



// get all course for only admin


export const getAllService = async (res: Response) => {
    const course = await Course.find().sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        course
    })
}