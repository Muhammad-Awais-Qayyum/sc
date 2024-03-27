"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAutheticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = require("./catchAsync");
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const redis_1 = require("../utils/redis");
exports.isAutheticated = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    const access_token = req.cookies.access_token;
    // i access the token through cookies
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    // i verify the token 
    const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
    if (!decoded) {
        return next(new ErrorHandler_1.default('Access token is not valid', 400));
    }
    // the jwt payload return the info
    // i used redis bcz if  i login the user the data is save in redis for caching
    const user = await redis_1.redis.get(decoded.id);
    if (!user) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    req.user = JSON.parse(user);
    next();
});
// validate  user role its only for admin
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler_1.default(`Role : ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
