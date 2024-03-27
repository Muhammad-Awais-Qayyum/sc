"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectedRoute_1 = require("../middleware/protectedRoute");
const layoutController_1 = require("../controllers/layoutController");
const userController_1 = require("../controllers/userController");
const layoutrouter = express_1.default.Router();
layoutrouter.post("/create-layout", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), layoutController_1.createLayout);
layoutrouter.put("/edit-layout", userController_1.AccessToken, protectedRoute_1.isAutheticated, (0, protectedRoute_1.authorizeRoles)("admin"), layoutController_1.editLayout);
layoutrouter.get("/get-layout/:type", layoutController_1.getLayout);
exports.default = layoutrouter;
