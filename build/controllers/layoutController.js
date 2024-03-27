"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayout = exports.editLayout = exports.createLayout = void 0;
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const catchAsync_1 = require("../middleware/catchAsync");
const layoutModel_1 = __importDefault(require("../model/layoutModel"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// create layout
exports.createLayout = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { type } = req.body;
        // check type exist
        const isTypeExist = await layoutModel_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} already exists`, 400));
        }
        if (type === "Banner") {
            const { title, image, subTitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "Layout",
            });
            const banner = {
                type: "Banner",
                banner: {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    },
                    title,
                    subTitle,
                },
            };
            await layoutModel_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map((item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layoutModel_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItems = await Promise.all(categories.map((item) => {
                return {
                    title: item.title,
                };
            }));
            await layoutModel_1.default.create({ type: "Categories", categories: categoryItems });
        }
        res.status(201).json({
            success: true,
            message: "Layout Created Successfully!",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//edit layout
exports.editLayout = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const bannerData = await layoutModel_1.default.findOne({ type: "Banner" });
            const { title, image, subTitle } = req.body;
            const data = image.startsWith("https") ? bannerData : await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "Layout",
            });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https") ? bannerData.banner.image.public_id : data?.public_id,
                    url: image.startsWith("https") ? bannerData.banner.image.url : data?.secure_url,
                },
                title,
                subTitle,
            };
            await layoutModel_1.default.findByIdAndUpdate(bannerData._id, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqData = await layoutModel_1.default.findOne({ type: "FAQ" });
            const faqItems = await Promise.all(faq.map((item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layoutModel_1.default.findByIdAndUpdate(faqData?._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryData = await layoutModel_1.default.findOne({ type: "Categories" });
            const categoryItems = await Promise.all(categories.map((item) => {
                return {
                    title: item.title,
                };
            }));
            await layoutModel_1.default.findByIdAndUpdate(categoryData?._id, {
                type: "Categories",
                categories: categoryItems,
            });
        }
        res.status(201).json({
            success: true,
            message: "Layout edit Successfully!",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get layout by type -- only admin
exports.getLayout = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { type } = req.params;
        if (!type) {
            return next(new ErrorHandler_1.default("Invalid Type", 400));
        }
        const layout = await layoutModel_1.default.findOne({ type });
        res.status(200).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
