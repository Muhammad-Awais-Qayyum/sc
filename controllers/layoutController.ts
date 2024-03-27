import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../ErrorHandler";
import { CatchAsync } from "../middleware/catchAsync";
import Layout from "../model/layoutModel";
import cloudinary from "cloudinary";

// create layout

export const createLayout = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body;

            // check type exist

            const isTypeExist = await Layout.findOne({ type });

            if (isTypeExist) {
                return next(new ErrorHandler(`${type} already exists`, 400));
            }
            if (type === "Banner") {
                const { title, image, subTitle } = req.body;

                const myCloud = await cloudinary.v2.uploader.upload(image, {
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
                await Layout.create(banner);
            }

            if (type === "FAQ") {
                const { faq } = req.body;
                
                const faqItems = await Promise.all(
                    faq.map((item: { question: string; answer: string }) => {
                        return {
                            question: item.question,
                            answer: item.answer,
                        };
            }))

                await Layout.create({ type: "FAQ", faq: faqItems });
            }

            if (type === "Categories") {
                const { categories } = req.body;
                const categoryItems = await Promise.all(
                    categories.map((item: any) => {
                        return {
                            title: item.title,
                        };
                    })
                );

                await Layout.create({ type: "Categories", categories: categoryItems });
            }

            res.status(201).json({
                success: true,
                message: "Layout Created Successfully!",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

//edit layout

export const editLayout = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body;

            if (type === "Banner") {
                const bannerData: any = await Layout.findOne({ type: "Banner" });




                const { title, image, subTitle } = req.body;

                const data = image.startsWith("https") ? bannerData : await cloudinary.v2.uploader.upload(image, {
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
                await Layout.findByIdAndUpdate(bannerData._id, { banner });
            }

            if (type === "FAQ") {
                const { faq } = req.body;
                const faqData = await Layout.findOne({ type: "FAQ" });
                const faqItems = await Promise.all(
                    faq.map((item: { question: string; answer: string }) => {
                        return {
                            question: item.question,
                            answer: item.answer,
                        };
                    })
                );

                await Layout.findByIdAndUpdate(faqData?._id, {
                    type: "FAQ",
                    faq: faqItems,
                });
            }

            if (type === "Categories") {
                const { categories } = req.body;
                const categoryData = await Layout.findOne({ type: "Categories" });

                const categoryItems = await Promise.all(
                    categories.map((item: any) => {
                        return {
                            title: item.title,
                        };
                    })
                );

                await Layout.findByIdAndUpdate(categoryData?._id, {
                    type: "Categories",
                    categories: categoryItems,
                });
            }

            res.status(201).json({
                success: true,
                message: "Layout edit Successfully!",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// get layout by type -- only admin

export const getLayout = CatchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.params;


            if (!type) {
                return next(new ErrorHandler("Invalid Type", 400));
            }
            const layout = await Layout.findOne({ type });

            res.status(200).json({
                success: true,
                layout,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);
