import express from "express";
import { addAnswer, addAnswerReview, addQuestion, addReview, deleteCourse, editCourse, generateVideoUrl, getAllCourse, getAllCourses, getCourseContent, getSingleCourse, uploadCourse } from "../controllers/courseController";
import { authorizeRoles, isAutheticated } from "../middleware/protectedRoute";
import { AccessToken } from "../controllers/userController";

const courserouter = express.Router();

courserouter.post(
    "/create-course",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    uploadCourse
);
courserouter.put(
    "/edit-course",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    editCourse
);
courserouter.get(
    "/get-course/:id",
    getSingleCourse
);
courserouter.get(
    "/get-all-course",
    getAllCourse
);
courserouter.get(
    "/get-course-content/:id",
    AccessToken,
    isAutheticated,
    getCourseContent
);
courserouter.put(
    "/add-question",
    AccessToken,
    isAutheticated,
    addQuestion
);
courserouter.put(
    "/add-answer-question",
    AccessToken,
    isAutheticated,
    addAnswer
);

courserouter.put(
    "/add-review/:id",
    AccessToken,
    isAutheticated,
    addReview
);
courserouter.put(
    "/add-answer-review",
    AccessToken,
    isAutheticated,
    addAnswerReview
);

courserouter.get(
    "/get-all-admin",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    getAllCourses
)

courserouter.delete(
    "/delete-course",
    AccessToken,
    isAutheticated,
    authorizeRoles("admin"),
    deleteCourse
)
courserouter.post(
    "/getVdoCipherOTP",
    generateVideoUrl
);


export default courserouter;
