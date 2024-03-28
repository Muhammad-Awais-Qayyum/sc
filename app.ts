import express, { NextFunction, Request, Response } from "express";

require("dotenv").config();
export const app = express();

import cors from "cors";
import { ErrorMiddleware } from "./middleware/error";
import { rateLimit } from 'express-rate-limit'


import cookieParser from "cookie-parser";
import userrouter from "./routes/userRoutes";
import courserouter from "./routes/courseRoutes";
import orderrouter from "./routes/orderRoutes";
import notificationrouter from "./routes/notificationRoutes";
import analyticsrouter from "./routes/analyticsRoutes";
import layoutrouter from "./routes/layoutRoutes";

const corsConfig = {
    origin: "*",
    credential: true,
    optionSuccessStatus: 200
}
// cookie parser

app.use(cookieParser());
//body parser

app.use(express.json({ limit: "50mb" }));

app.set('trust proxy', 1);


// cors for orgin

app.use(
    cors(corsConfig)
);


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

// Apply the rate limiting middleware to all requests.
app.use(limiter)
// routes
app.use('/api/v1', courserouter, userrouter, orderrouter, notificationrouter, analyticsrouter, layoutrouter)

// testing api

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "Api is working",
    });
});

// unknown route

app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found `) as any;

    (err.statusCode = 404), next(err);
});
// Error Middleware
app.use(ErrorMiddleware);
