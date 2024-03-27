import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModel";

// interface for comment on video
interface IComment extends Document {
    user: IUser;
    question: string;
    questionReplies?: IComment[];
}

// interface for review course
interface IReview extends Document {
    user: IUser;
    rating: Number;
    review: string;
    commentReplies?: IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}

interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestion: string;
    questions: IComment[];
}

interface ICourse extends Document {
    name: string;
    description: string;
    price: number;
    estimatedPrice?: number;
    tags: string;
    thumbnail: object;
    level: string;
    demoUrl: string;
    benefits: { title: string }[];
    prerequisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData[];
    rating?: number;
    purchased: number;
    categories: string;
}

// its a reviewSchema
const reviewSchema = new Schema<IReview>({
    user: Object,
    rating: {
        type: Number,
        default: 0,
    },
    review: String,
    commentReplies: [Object]
},{timestamps:true});

// its  a link Schemea

const linkSchema = new Schema<ILink>({
    title: String,
    url: String,
});

// its  a Comment Schema

const commentSchema = new Schema<IComment>({
    user: Object,
    question: String,
    questionReplies: [Object],
},{timestamps:true});

//its  a courseData means data couse video name video e.t.c

const courseDataSchema = new Schema<ICourseData>({
    title: String,
    videoLength: Number,
    videoUrl: String,
    videoSection: String,
    description: String,
    questions: [commentSchema],
    suggestion: String,
    links: [linkSchema],
    videoPlayer: String,

});

// its  a courseSchema for which course name price e.t.c

const courseSchema = new Schema<ICourse>({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    categories: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    estimatedPrice: Number,
    tags: {
        type: String,
        required: true,
    },
    thumbnail: {
        public_id: {
            type: String,

        },
        url: {
            type: String,

        },
    },
    level: {
        type: String,
        required: true,
    },
    demoUrl: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    purchased: {
        type: Number,
        default: 0,
    },
    courseData: [courseDataSchema],
    reviews: [reviewSchema],
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
}, { timestamps: true });


const Course: Model<ICourse> = mongoose.model("Course", courseSchema)

export default Course;