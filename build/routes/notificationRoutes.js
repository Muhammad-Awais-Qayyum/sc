"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectedRoute_1 = require("../middleware/protectedRoute");
const notificationController_1 = require("../controllers/notificationController");
const userController_1 = require("../controllers/userController");
const notificationrouter = express_1.default.Router();
notificationrouter.get('/all-notification', userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), notificationController_1.getNotification);
notificationrouter.put('/update-notification/:id', userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), notificationController_1.updateNotification);
exports.default = notificationrouter;
