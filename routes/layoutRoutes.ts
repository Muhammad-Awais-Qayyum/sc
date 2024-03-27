import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/protectedRoute";
import { createLayout, editLayout, getLayout } from "../controllers/layoutController";
import { AccessToken } from "../controllers/userController";

const layoutrouter = express.Router();

layoutrouter.post(
    "/create-layout",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    createLayout
);
layoutrouter.put(
    "/edit-layout",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    editLayout
);
layoutrouter.get(
    "/get-layout/:type",
    getLayout
);
export default layoutrouter;
