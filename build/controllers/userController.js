"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateAvatar = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.AccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registerionUser = void 0;
require("dotenv").config();
const jwt_1 = require("../utils/jwt");
const userModel_1 = require("../model/userModel");
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const catchAsync_1 = require("../middleware/catchAsync");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const redis_1 = require("../utils/redis");
const userService_1 = require("../services/userService");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registerionUser = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // isEmailExit
        const isEmailExit = await userModel_1.User.findOne({ email });
        if (isEmailExit) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = {
            name,
            email,
            password,
        };
        // create a function for jwt token for create token for activation email
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = {
            user: {
                name: user.name,
            },
            activationCode,
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-email.ejs"), data);
        try {
            // send mail is componnet for sending mail
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "Activate your Account",
                template: "activation-email.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} to  activate your account!`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
const createActivationToken = (user) => {
    // its make a random for otp verification
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    // ACTIVATION_SECRET this token is create for activation otp purpose
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_TOKEN, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_TOKEN);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await userModel_1.User.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = await userModel_1.User.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.loginUser = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        // check email exists
        const user = await userModel_1.User.findOne({ email }).select("+password");
        // if not than show error
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        // compare password
        const isPasswordMatch = await user?.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        // cretae jwt token and send cookie res sendToken its a componnet
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// logout functionality
exports.logoutUser = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || "";
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// update Access Token bcz access token is expire in few minutes
exports.AccessToken = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const refresh_Token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_Token, process.env.REFRESH_TOKEN);
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login to access this resource!", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "5m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "3d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user._id, JSON.stringify(user), 'EX', 604800);
        next();
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// get user info single user
exports.getUserInfo = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        // i used protetct route the prtect route retuer req.user info
        const userId = req.user?._id;
        (0, userService_1.getUserById)(userId, res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.socialAuth = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        // check user is exists
        const user = await userModel_1.User.findOne({ email });
        if (!user) {
            const newUser = await userModel_1.User.create({ email, name, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;
        const user = await userModel_1.User.findById(userId);
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.updatePassword = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new Password", 400));
        }
        const user = await userModel_1.User.findById(req.user?._id).select("+password");
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid user", 400));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid Old Password", 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.updateAvatar = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    const { avatar } = req.body;
    const userId = req.user?._id;
    const user = await userModel_1.User.findById(userId);
    if (user && avatar) {
        // if user have  a avatr than if condition run
        if (user?.avatar?.public_id) {
            // delte the avatar
            await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
            // upload new avatar
            const mycloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                folder: "avatars",
            });
            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            };
        }
        else {
            // if user have no avatr than uplaod the new avatar
            const mycloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                folder: "avatars",
            });
            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            };
        }
    }
    await user?.save();
    await redis_1.redis.set(userId, JSON.stringify(user));
    res.status(200).json({
        success: true,
        user,
    });
});
// get all users -- only for admin access
exports.getAllUsers = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        (0, userService_1.getAllUser)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update user roles -- only admin access
exports.updateUserRole = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        (0, userService_1.updateRoleService)(res, email, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Delte user -- only admin access
exports.deleteUser = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { id } = req.body;
        const user = await userModel_1.User.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not Found", 400));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted Successfully!"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
