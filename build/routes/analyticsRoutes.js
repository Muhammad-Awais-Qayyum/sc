"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectedRoute_1 = require("../middleware/protectedRoute");
const analyticsController_1 = require("../controllers/analyticsController");
const userController_1 = require("../controllers/userController");
const analyticsrouter = express_1.default.Router();
analyticsrouter.get("/get-user-analytics", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), analyticsController_1.getUserAnalytics);
analyticsrouter.get("/get-course-analytics", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), analyticsController_1.getCourseAnalytics);
analyticsrouter.get("/get-order-analytics", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), analyticsController_1.getOrderAnalytics);
exports.default = analyticsrouter;
