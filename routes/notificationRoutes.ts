import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/protectedRoute";
import { getNotification, updateNotification } from "../controllers/notificationController";
import { AccessToken } from "../controllers/userController";



const notificationrouter = express.Router()



notificationrouter.get('/all-notification', AccessToken, isAutheticated, authorizeRoles("admin"), getNotification)
notificationrouter.put('/update-notification/:id', AccessToken, isAutheticated, authorizeRoles("admin"), updateNotification)


export default notificationrouter;