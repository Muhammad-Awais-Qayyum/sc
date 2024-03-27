require("dotenv").config();
import { redis } from "./redis";
import { IUser } from "../model/userModel";


interface ITokenOption {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none" | undefined;
    secure?: boolean;
}


const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPIRE || "300",
    10
);

const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPIRE || "1200",
    10
);

// options for cookie

export const accessTokenOptions: ITokenOption = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};

export const refreshTokenOptions: ITokenOption = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};


export const sendToken = (user: IUser, statusCode: number, res: any) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();


    // radis used for caching and store user data

    redis.set(user._id, JSON.stringify(user))
    // token expire used if env not proprly used


    // only set true in production
    if (process.env.NODE_ENV === "production") {
        accessTokenOptions.secure = true;
    }

    //send cookie for responce

    res
        .cookie(
            "access_token",
            accessToken,
            accessTokenOptions
        )

    res
        .cookie(
            "refresh_token",
            refreshToken,
            refreshTokenOptions
        )
    res
        .status(statusCode)
        .json({ success: true, user, accessToken });
};
