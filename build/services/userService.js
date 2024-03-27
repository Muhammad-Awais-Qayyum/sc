"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleService = exports.getAllUser = exports.getUserById = void 0;
const userModel_1 = require("../model/userModel");
const redis_1 = require("../utils/redis");
const getUserById = async (id, res) => {
    const userJson = await redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user
        });
    }
};
exports.getUserById = getUserById;
// get all users
const getAllUser = async (res) => {
    const users = await userModel_1.User.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        users
    });
};
exports.getAllUser = getAllUser;
//
const updateRoleService = async (res, email, role) => {
    const user = await userModel_1.User.findOneAndUpdate({ email }, { role }, { new: true });
    res.status(201).json({
        success: true,
        user
    });
};
exports.updateRoleService = updateRoleService;
