import express from "express";
import {
    AccessToken,
    activateUser,
    deleteUser,
    getAllUsers,
    getUserInfo,
    loginUser,
    logoutUser,
    registerionUser,
    socialAuth,
    updateAvatar,
    updatePassword,
    updateUserInfo,
    updateUserRole,
} from "../controllers/userController";
import { authorizeRoles, isAutheticated } from "../middleware/protectedRoute";

const userrouter = express.Router();

userrouter.post("/registration", registerionUser);
userrouter.post("/activate-user", activateUser);
userrouter.post("/login", loginUser);
userrouter.post("/social-auth", socialAuth);
userrouter.get("/logout", AccessToken, isAutheticated, logoutUser);
userrouter.get("/refreshtoken", AccessToken);
userrouter.get("/me", AccessToken, isAutheticated, getUserInfo);
userrouter.put("/update-user", AccessToken, isAutheticated, updateUserInfo);
userrouter.put("/update-password", AccessToken, isAutheticated, updatePassword);
userrouter.put("/update-avatar", AccessToken, isAutheticated, updateAvatar);
userrouter.get(
    "/all-users",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    getAllUsers
);
userrouter.put(
    "/update-role",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    updateUserRole
);

userrouter.delete(
    "/delete-user",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    deleteUser
);
export default userrouter;
