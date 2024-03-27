"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
require("dotenv").config();
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const error_1 = require("./middleware/error");
const express_rate_limit_1 = require("express-rate-limit");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const layoutRoutes_1 = __importDefault(require("./routes/layoutRoutes"));
// cookie parser
exports.app.use((0, cookie_parser_1.default)());
//body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
// cors for orgin
exports.app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true
}));
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
});
// Apply the rate limiting middleware to all requests.
exports.app.use(limiter);
// routes
exports.app.use('/api/v1', courseRoutes_1.default, userRoutes_1.default, orderRoutes_1.default, notificationRoutes_1.default, analyticsRoutes_1.default, layoutRoutes_1.default);
// testing api
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Api is working",
    });
});
// unknown route
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found `);
    (err.statusCode = 404), next(err);
});
// Error Middleware
exports.app.use(error_1.ErrorMiddleware);
