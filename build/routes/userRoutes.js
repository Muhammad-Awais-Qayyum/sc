"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const protectedRoute_1 = require("../middleware/protectedRoute");
const userrouter = express_1.default.Router();
userrouter.post("/registration", userController_1.registerionUser);
userrouter.post("/activate-user", userController_1.activateUser);
userrouter.post("/login", userController_1.loginUser);
userrouter.post("/social-auth", userController_1.socialAuth);
userrouter.get("/logout", userController_1.AccessToken, protectedRoute_1.isAutheticated, userController_1.logoutUser);
userrouter.get("/refreshtoken", userController_1.AccessToken);
userrouter.get("/me", userController_1.AccessToken, protectedRoute_1.isAutheticated, userController_1.getUserInfo);
userrouter.put("/update-user", userController_1.AccessToken, protectedRoute_1.isAutheticated, userController_1.updateUserInfo);
userrouter.put("/update-password", userController_1.AccessToken, protectedRoute_1.isAutheticated, userController_1.updatePassword);
userrouter.put("/update-avatar", userController_1.AccessToken, protectedRoute_1.isAutheticated, userController_1.updateAvatar);
userrouter.get("/all-users", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), userController_1.getAllUsers);
userrouter.put("/update-role", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), userController_1.updateUserRole);
userrouter.delete("/delete-user", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), userController_1.deleteUser);
exports.default = userrouter;