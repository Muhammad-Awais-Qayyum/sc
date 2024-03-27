require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import {
    accessTokenOptions,
    refreshTokenOptions,
    sendToken,
} from "../utils/jwt";
import { User, IUser } from "../model/userModel";
import ErrorHandler from "../ErrorHandler";
import { CatchAsync } from "../middleware/catchAsync";
import Jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { redis } from "../utils/redis";
import { getAllUser, getUserById, updateRoleService } from "../services/userService";
import cloudinary from "cloudinary";
// register user

interface IRegisterionBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerionUser = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password } = req.body as IRegisterionBody;

            // isEmailExit

            const isEmailExit = await User.findOne({ email });

            if (isEmailExit) {
                return next(new ErrorHandler("Email already exist", 400));
            }

            const user: IRegisterionBody = {
                name,
                email,
                password,
            };

            // create a function for jwt token for create token for activation email
            const activationToken = createActivationToken(user);

            const activationCode = activationToken.activationCode;

            const data = {
                user: {
                    name: user.name,
                },
                activationCode,
            };

            const html = await ejs.renderFile(
                path.join(__dirname, "../mails/activation-email.ejs"),
                data
            );

            try {
                // send mail is componnet for sending mail
                await sendMail({
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
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 400));
            }
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// functinality for jwt create activation token

interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    // its make a random for otp verification
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // ACTIVATION_SECRET this token is create for activation otp purpose
    const token = Jwt.sign(
        { user, activationCode },
        process.env.ACTIVATION_TOKEN as Secret,
        {
            expiresIn: "5m",
        }
    );

    return { token, activationCode };
};

// activate user

interface IActivationrRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } =
                req.body as IActivationrRequest;

            const newUser: { user: IUser; activationCode: string } = Jwt.verify(
                activation_token,
                process.env.ACTIVATION_TOKEN as string
            ) as { user: IUser; activationCode: string };

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler("Invalid activation code", 400));
            }

            const { name, email, password } = newUser.user;

            const existUser = await User.findOne({ email });

            if (existUser) {
                return next(new ErrorHandler("Email already exist", 400));
            }

            const user = await User.create({
                name,
                email,
                password,
            });
            res.status(201).json({
                success: true,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

/// login functionality

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body as ILoginRequest;


            if (!email || !password) {
                return next(new ErrorHandler("Please enter email and password", 400));
            }

            // check email exists
            const user = await User.findOne({ email }).select("+password");
            // if not than show error
            if (!user) {
                return next(new ErrorHandler("Invalid email or password", 400));
            }

            // compare password
            const isPasswordMatch = await user?.comparePassword(password);
            if (!isPasswordMatch) {
                return next(new ErrorHandler("Invalid email or password", 400));
            }

            // cretae jwt token and send cookie res sendToken its a componnet

            sendToken(user, 200, res);
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// logout functionality

export const logoutUser = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", { maxAge: 1 });

            res.cookie("refresh_token", "", { maxAge: 1 });
            const userId = req.user?._id || "";
            redis.del(userId);
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// update Access Token bcz access token is expire in few minutes

export const AccessToken = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refresh_Token = req.cookies.refresh_token as string;


            const decoded = Jwt.verify(
                refresh_Token,
                process.env.REFRESH_TOKEN as string
            ) as JwtPayload;

            const message = "Could not refresh token";

            if (!decoded) {
                return next(new ErrorHandler(message, 400));
            }

            const session = await redis.get(decoded.id as string);

            if (!session) {
                return next(new ErrorHandler("Please login to access this resource!", 400));
            }

            const user = JSON.parse(session);

            const accessToken = Jwt.sign(
                { id: user._id },
                process.env.ACCESS_TOKEN as string,
                {
                    expiresIn: "5m",
                }
            );

            const refreshToken = Jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN as string,
                {
                    expiresIn: "3d",
                }
            );

            req.user = user;

            res.cookie("access_token", accessToken, accessTokenOptions);
            res.cookie("refresh_token", refreshToken, refreshTokenOptions);

            await redis.set(user._id, JSON.stringify(user), 'EX', 604800)
            next();
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// get user info single user

export const getUserInfo = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // i used protetct route the prtect route retuer req.user info
            const userId = req.user?._id;
            getUserById(userId, res);
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// social auth

interface ISocialAuthBdoy {
    email: string;
    name: string;
    avatar: string;
}

export const socialAuth = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, name, avatar } = req.body as ISocialAuthBdoy;

            // check user is exists

            const user = await User.findOne({ email });

            if (!user) {
                const newUser = await User.create({ email, name, avatar });

                sendToken(newUser, 200, res);
            } else {
                sendToken(user, 200, res);
            }
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// update user info

interface IUpdate {
    name?: string;
    email?: string;
}

export const updateUserInfo = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name } = req.body as IUpdate;
            const userId = req.user?._id;
            const user = await User.findById(userId);

            if (name && user) {
                user.name = name;
            }



            await user?.save();

            await redis.set(userId, JSON.stringify(user));

            res.status(200).json({
                success: true,
                user,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// update password

interface IPassword {
    oldPassword: string;
    newPassword: string;
}

export const updatePassword = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { oldPassword, newPassword } = req.body as IPassword;

            if (!oldPassword || !newPassword) {
                return next(new ErrorHandler("Please enter old and new Password", 400));
            }
            const user = await User.findById(req.user?._id).select("+password");

            if (user?.password === undefined) {
                return next(new ErrorHandler("Invalid user", 400));
            }

            const isPasswordMatch = await user?.comparePassword(oldPassword);

            if (!isPasswordMatch) {
                return next(new ErrorHandler("Invalid Old Password", 400));
            }

            user.password = newPassword;

            await user.save();

            await redis.set(req.user?._id, JSON.stringify(user));

            res.status(200).json({
                success: true,
                user,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// updata avatar or profile picture

interface IProfileUpdae {
    avatar: string;
}

export const updateAvatar = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { avatar } = req.body as IProfileUpdae;

        const userId = req.user?._id;

        const user = await User.findById(userId);

        if (user && avatar) {
            // if user have  a avatr than if condition run
            if (user?.avatar?.public_id) {
                // delte the avatar
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
                // upload new avatar
                const mycloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",

                });

                user.avatar = {
                    public_id: mycloud.public_id,
                    url: mycloud.secure_url,
                };
            } else {
                // if user have no avatr than uplaod the new avatar
                const mycloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                });

                user.avatar = {
                    public_id: mycloud.public_id,
                    url: mycloud.secure_url,
                };
            }
        }
        await user?.save();

        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({
            success: true,
            user,
        });
    }
);


// get all users -- only for admin access

export const getAllUsers = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllUser(res)
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// update user roles -- only admin access

export const updateUserRole = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, role } = req.body



        updateRoleService(res, email, role)
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// Delte user -- only admin access


export const deleteUser = CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.body;

        const user = await User.findById(id)


        if (!user) {
            return next(new ErrorHandler("User not Found", 400))
        }

        await user.deleteOne({ id })

        await redis.del(id);

        res.status(200).json({
            success: true,
            message: "User deleted Successfully!"
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})