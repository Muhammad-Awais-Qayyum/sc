"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCourses = exports.addAnswerReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseContent = exports.getAllCourse = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const ErrorHandler_1 = __importDefault(require("../ErrorHandler"));
const cousreModel_1 = __importDefault(require("../model/cousreModel"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const courseService_1 = require("../services/courseService");
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notificationModel_1 = __importDefault(require("../model/notificationModel"));
const axios_1 = __importDefault(require("axios"));
// upload course
exports.uploadCourse = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, courseService_1.createCourse)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// edit course
exports.editCourse = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { data, id } = req.body;
        const thumbnail = data.thumbnail;
        const courseData = (await cousreModel_1.default.findById(id));
        if (thumbnail && !thumbnail.startsWith("https")) {
            if (courseData.thumbnail.public_id) {
                await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            }
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData.thumbnail.public_id,
                url: courseData.thumbnail.url,
            };
        }
        const course = await cousreModel_1.default.findByIdAndUpdate(id, {
            $set: data,
        }, {
            new: true,
        });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// get only single course -- without purshasing the course
exports.getSingleCourse = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const course = await cousreModel_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions");
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// get all course -- without purchase
// same method used i store also data in redis and get the data in cache
exports.getAllCourse = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const course = await cousreModel_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions");
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// get course content/data --only validate user
exports.getCourseContent = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        // check user have course
        const userCourseList = req.user?.courses;
        // And user send the params id which course content asses
        const courseId = req.params.id;
        // check course is exist
        const courseExist = userCourseList?.find((course) => course._id.toString() === courseId);
        if (!courseExist) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 403));
        }
        // find the course data
        const course = await cousreModel_1.default.findById(courseId);
        // courseData is only store the content
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.addQuestion = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await cousreModel_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = course?.courseData.find((item) => item._id.toString() === contentId);
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid or missing content ID", 400));
        }
        // create a new Question Object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // push question to courseContent
        courseContent.questions.push(newQuestion);
        // add notification for admin notify
        await notificationModel_1.default.create({
            userId: req.user?._id,
            title: "New Question Recieved",
            message: `You have  a new question in ${courseContent.title}`,
        });
        // update the course
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.addAnswer = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { answer, contentId, courseId, questionId } = req.body;
        const course = await cousreModel_1.default.findById(courseId);
        console.log({
            answer, contentId, courseId, questionId
        });
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = course?.courseData.find((item) => item._id.toString() === contentId);
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid or missing content ID", 400));
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(questionId)) {
            return next(new ErrorHandler_1.default("Invalid question id", 400));
        }
        const question = courseContent.questions.find((item) => item._id.toString() === questionId);
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid or missing question ID", 400));
        }
        // create a new Answer Object
        const newAnswer = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // push question to courseContent
        question?.questionReplies?.push(newAnswer);
        // update the course
        await course?.save();
        if (req.user?._id === question.user._id) {
            // create notification
            await notificationModel_1.default.create({
                userId: req.user?._id,
                title: "New Question Reply Recevied",
                message: `You have a new question reply in ${courseContent.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.addReview = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userCourseList = req.user?.courses;
        const reviewExist = userCourseList?.some((course) => course._id.toString() === courseId.toString());
        if (!reviewExist) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 400));
        }
        const cousre = await cousreModel_1.default.findById(courseId);
        const { review, rating } = req.body;
        // create Review Object
        const Review = {
            user: req.user,
            rating,
            review,
        };
        // push data into reviews
        cousre?.reviews.push(Review);
        // find rating
        let avg = 0;
        cousre?.reviews.forEach((rev) => {
            avg = rev.rating;
        });
        if (cousre) {
            cousre.rating = avg / cousre.reviews.length;
        }
        // course save
        await cousre?.save();
        await redis_1.redis.set(courseId, JSON.stringify(cousre), "EX", 604800);
        // create notification
        await notificationModel_1.default.create({
            userId: req.user?._id,
            title: "New Review Recieved",
            message: `${req.user?.name} has a given review in ${cousre?.name}`
        });
        res.status(200).json({
            success: true,
            cousre,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.addAnswerReview = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await cousreModel_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const reviewExist = course?.reviews.find((rev) => rev._id.toString() === reviewId);
        if (!reviewExist) {
            return next(new ErrorHandler_1.default("Review not found", 400));
        }
        const newAnswer = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (!reviewExist.commentReplies) {
            reviewExist.commentReplies = [];
        }
        // push data into course reviews
        reviewExist.commentReplies?.push(newAnswer);
        // course save
        await course.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// get all cousre -- only admin access
exports.getAllCourses = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        (0, courseService_1.getAllService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete course -- only admin access
exports.deleteCourse = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { id } = req.body;
        const course = await cousreModel_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not Found", 400));
        }
        await course.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "Course deleted Successfully!",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// generate video url
exports.generateVideoUrl = (0, catchAsync_1.CatchAsync)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHERE_API_SECRET}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
