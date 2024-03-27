"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllService = exports.createCourse = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const cousreModel_1 = __importDefault(require("../model/cousreModel"));
exports.createCourse = (0, catchAsync_1.CatchAsync)(async (data, res) => {
    const course = await cousreModel_1.default.create(data);
    res.status(201).json({
        success: true,
        course
    });
});
// get all course for only admin
const getAllService = async (res) => {
    const course = await cousreModel_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        course
    });
};
exports.getAllService = getAllService;
