import { NextFunction, Response } from "express"
import { User } from "../model/userModel"
import { redis } from "../utils/redis"
import ErrorHandler from "../ErrorHandler"



export const getUserById = async (id: string, res: Response) => {
    const userJson = await redis.get(id)
    if (userJson) {
        const user = JSON.parse(userJson)

        res.status(201).json({
            success: true,
            user
        })
    }

}


// get all users
export const getAllUser = async (res: Response) => {
    const users = await User.find().sort({ createdAt: -1 })

    res.status(201).json({
        success: true,
        users
    })
}

//
export const updateRoleService = async (res: Response, email: string, role: string) => {
    const user = await User.findOneAndUpdate({ email }, { role }, { new: true });



    res.status(201).json({
        success: true,
        user
    })
}