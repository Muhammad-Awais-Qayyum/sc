import { CatchAsync } from "../middleware/catchAsync";
import ErrorHandler from "../ErrorHandler";
import Course from "../model/cousreModel";
import cloudinary from "cloudinary";
import { NextFunction, Request, Response, response } from "express";
import { createCourse, getAllService } from "../services/courseService";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import Notification from "../model/notificationModel";
import axios from "axios";

// upload course

export const uploadCourse = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const thumbnail = data.thumbnail;

            if (thumbnail) {
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            createCourse(data, res, next);
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// edit course

export const editCourse = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { data, id } = req.body;

            const thumbnail = data.thumbnail;

            const courseData = (await Course.findById(id)) as any;

            if (thumbnail && !thumbnail.startsWith("https")) {
                if (courseData.thumbnail.public_id) {
                    await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
                }

                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
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

            const course = await Course.findByIdAndUpdate(
                id,
                {
                    $set: data,
                },
                {
                    new: true,
                }
            );

            res.status(201).json({
                success: true,
                course,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// get only single course -- without purshasing the course

export const getSingleCourse = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;

            const course = await Course.findById(courseId).select(
                "-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions"
            );

            res.status(200).json({
                success: true,
                course,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// get all course -- without purchase
// same method used i store also data in redis and get the data in cache
export const getAllCourse = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const course = await Course.find().select(
                "-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions"
            );

            res.status(200).json({
                success: true,
                course,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// get course content/data --only validate user
export const getCourseContent = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // check user have course
            const userCourseList = req.user?.courses;
            // And user send the params id which course content asses


            const courseId = req.params.id;

            // check course is exist
            const courseExist = userCourseList?.find(
                (course: any) => course._id.toString() === courseId
            );
            if (!courseExist) {
                return next(
                    new ErrorHandler("You are not eligible to access this course", 403)
                );
            }
            // find the course data
            const course = await Course.findById(courseId);

            // courseData is only store the content
            const content = course?.courseData;

            res.status(200).json({
                success: true,
                content,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// add question in course content

interface IQuestion {
    question: string;
    courseId: string;
    contentId: string;
}
export const addQuestion = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { question, courseId, contentId }: IQuestion = req.body;

            const course = await Course.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("Invalid content id", 400));
            }
            const courseContent = course?.courseData.find(
                (item: any) => item._id.toString() === contentId
            );

            if (!courseContent) {
                return next(new ErrorHandler("Invalid or missing content ID", 400));
            }

            // create a new Question Object
            const newQuestion: any = {
                user: req.user,
                question,
                questionReplies: [],
            };

            // push question to courseContent
            courseContent.questions.push(newQuestion);

            // add notification for admin notify

            await Notification.create({
                userId: req.user?._id,
                title: "New Question Recieved",
                message: `You have  a new question in ${courseContent.title}`,
            });
            // update the course
            await course?.save();
            await redis.set(courseId,JSON.stringify(course),"EX",604800);
            res.status(200).json({
                success: true,
                course,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// add answer

interface IAnswer {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { answer, contentId, courseId, questionId } = req.body as IAnswer;
            const course = await Course.findById(courseId);

            console.log({
                answer, contentId, courseId, questionId
            })
            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }
            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("Invalid content id", 400));
            }
            
            const courseContent = course?.courseData.find(
                (item: any) => item._id.toString() === contentId
            );

            if (!courseContent) {
                return next(new ErrorHandler("Invalid or missing content ID", 400));
            }

            if (!mongoose.Types.ObjectId.isValid(questionId)) {
                return next(new ErrorHandler("Invalid question id", 400));
            }
            const question = courseContent.questions.find(
                (item: any) => item._id.toString() === questionId
            );

            if (!question) {
                return next(new ErrorHandler("Invalid or missing question ID", 400));
            }

            // create a new Answer Object
            const newAnswer: any = {
                user: req.user,
                answer,
                createdAt:new Date().toISOString(),
                updatedAt:new Date().toISOString()
            };

            // push question to courseContent
            question?.questionReplies?.push(newAnswer);

            // update the course
            await course?.save();


            if (req.user?._id === question.user._id) {
                // create notification
                await Notification.create({
                    userId: req.user?._id,
                    title: "New Question Reply Recevied",
                    message: `You have a new question reply in ${courseContent.title}`,
                });
            } else {
                const data = {
                    name: question.user.name,
                    title: courseContent.title,
                };

                const html = await ejs.renderFile(
                    path.join(__dirname, "../mails/question-reply.ejs"),
                    data
                );
                try {
                    await sendMail({
                        email: question.user.email,
                        subject: "Question Reply",
                        template: "question-reply.ejs",
                        data,
                    });
                } catch (error: any) {
                    return next(new ErrorHandler(error.message, 400));
                }
            }

            res.status(200).json({
                success: true,
                course,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// add review

interface IReview {
    review: string;
    rating: Number;
    userId: string;
}

export const addReview = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;
            const userCourseList = req.user?.courses;

            const reviewExist = userCourseList?.some(
                (course: any) => course._id.toString() === courseId.toString()
            );

            if (!reviewExist) {
                return next(
                    new ErrorHandler("You are not eligible to access this course", 400)
                );
            }

            const cousre = await Course.findById(courseId);
            const { review, rating } = req.body as IReview;

            // create Review Object
            const Review: any = {
                user: req.user,
                rating,
                review,
            };

            // push data into reviews
            cousre?.reviews.push(Review);

            // find rating

            let avg = 0;
            cousre?.reviews.forEach((rev: any) => {
                avg = rev.rating;
            });

            if (cousre) {
                cousre.rating = avg / cousre.reviews.length;
            }

            // course save

            await cousre?.save();

            await redis.set(courseId,JSON.stringify(cousre),"EX",604800);

            // create notification
            await Notification.create({
                userId: req.user?._id,
                title: "New Review Recieved",
                message: `${req.user?.name} has a given review in ${cousre?.name}`
            });

            res.status(200).json({
                success: true,
                cousre,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// addAnswerReview

interface IAnswerReview {
    comment: string;
    courseId: string;
    reviewId: string;
}

export const addAnswerReview = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { comment, courseId, reviewId } = req.body as IAnswerReview;

            const course = await Course.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 400));
            }
            const reviewExist = course?.reviews.find(
                (rev: any) => rev._id.toString() === reviewId
            );

            if (!reviewExist) {
                return next(new ErrorHandler("Review not found", 400));
            }

            const newAnswer: any = {
                user: req.user,
                comment,
                createdAt:new Date().toISOString(),
                updatedAt:new Date().toISOString()
            };

            if (!reviewExist.commentReplies) {
                reviewExist.commentReplies = [];
            }
            // push data into course reviews
            reviewExist.commentReplies?.push(newAnswer);

            // course save

            await course.save();

            await redis.set(courseId,JSON.stringify(course),"EX",604800);

            res.status(200).json({
                success: true,
                course,
            });
        } catch (err: any) {
            return next(new ErrorHandler(err.message, 400));
        }
    }
);

// get all cousre -- only admin access

export const getAllCourses = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllService(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// delete course -- only admin access
export const deleteCourse = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.body;
            const course = await Course.findById(id);

            if (!course) {
                return next(new ErrorHandler("Course not Found", 400));
            }

            await course.deleteOne({ id });

            await redis.del(id);

            res.status(200).json({
                success: true,
                message: "Course deleted Successfully!",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// generate video url

export const generateVideoUrl = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.body;
            const response = await axios.post(
                `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
                { ttl: 300 },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Apisecret ${process.env.VDOCIPHERE_API_SECRET}`,
                    },
                }
            );

            res.json(response.data);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);
