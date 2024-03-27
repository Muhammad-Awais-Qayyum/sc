import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/protectedRoute";
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from "../controllers/analyticsController";
import { AccessToken } from "../controllers/userController";

const analyticsrouter = express.Router();

analyticsrouter.get(
    "/get-user-analytics",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    getUserAnalytics
);

analyticsrouter.get(
    "/get-course-analytics",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    getCourseAnalytics
);


analyticsrouter.get(
    "/get-order-analytics",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    getOrderAnalytics
);
export default analyticsrouter;
