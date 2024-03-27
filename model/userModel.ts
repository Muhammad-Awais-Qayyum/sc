require('dotenv').config()
import mongoose, { Model, Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";

// it is used for validation for email
const emailRegexPattern: RegExp = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;

// Your IUser interface defines the structure of a user document in a MongoDB collection
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken: () => string
    SignRefreshToken: () => string

}

const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            // for validation email is correct
            validate: {
                validator: function (value: string) {
                    return emailRegexPattern.test(value);
                },
                message: "please enter a valid email",
            },
            unique: true,
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
            select: false
        },
        avatar: {
            public_id: String,
            url: String,
        },
        role: {
            type: String,
            default: "user",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        courses: [
            {
                courseId: String,
            },
        ],
    },
    { timestamps: true }
);

// Hash Password

userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    this.password = await bcrypt.hash(this.password, 10);

    next();
});


// if user signin jwt Access token create
userSchema.methods.SignAccessToken = function () {
    return Jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
        expiresIn: '5m'
    })
}

// if user signin jwt refresh token create
userSchema.methods.SignRefreshToken = function () {
    return Jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
        expiresIn: '3d'
    })
}

// compare Password

userSchema.methods.comparePassword = async function (
    enterPassword: string
): Promise<boolean> {
    return await bcrypt.compare(enterPassword, this.password);
};

export const User: Model<IUser> = mongoose.model("User", userSchema);
