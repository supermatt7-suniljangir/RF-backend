import {NextFunction, Request, Response} from "express";
import {googleAuth} from "./googleAuth.controller";
import {Types} from "mongoose";
import {Profile, Social, UserType} from "../types/user";
import logger from "../config/logger";
import generateToken from "../utils/generateToken";
import {AppError, success} from "../utils/responseTypes";
import UserService from "../services/UserService";
import {STAGES} from "../utils/stages";
import User from "../models/user/user.model";

class UserController {
    static async getUserProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        if (!req.user) {
            next(new AppError("User not found", 404));
            return;
        }

        try {
            const user = await UserService.getUserById(req.user._id);
            if (!user) {
                next(new AppError("User not found", 404));
                return;
            }
            res.status(200).json(
                success({
                    data: user,
                    message: "User Profile fetched successfully",
                })
            );
        } catch (error: any) {
            logger.error("Error fetching user profile:", error);
            next(new AppError(error.message, 500));
        }
    }

    static async authUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        const {email, password, googleToken} = req.body;

        try {
            // Google Authentication Flow
            if (googleToken) {
                const googleUserData = await googleAuth(googleToken);
                const user = await UserService.getUserByEmail(googleUserData.email);
                if (!user) {
                    next(new AppError("User not found", 404));
                    return;
                }
                generateToken(res, user._id);
                res.status(200).json(
                    success({
                        data: true,
                        message: "User authenticated successfully",
                    })
                );
                return;
            }

            // Email/Password Authentication Flow
            const user = await UserService.getUserByEmail(email, true);

            if (!user) {
                next(new AppError("Invalid email or password", 401));
                return;
            }

            const isPasswordCorrect = await user.comparePassword!(password);
            if (!isPasswordCorrect) {
                next(new AppError("Invalid email or password", 401));
                return;
            }

            generateToken(res, user._id);
            res.status(200).json(
                success({
                    data: true,
                    message: "User authenticated successfully",
                })
            );
        } catch (error: any) {
            logger.error("Error authenticating user:", error.message);
            next(new AppError(`Error Authenticating user: ${error.message}`, 500));
        }
    }

    static async registerUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        const {email, password, fullName, googleToken} = req.body;

        if (googleToken) {
            try {
                const googleUserData = await googleAuth(googleToken);
                generateToken(res, googleUserData._id);
                res.status(201).json(
                    success({
                        message: "User created successfully",
                        data: true,
                    })
                );
            } catch (error: any) {
                next(
                    new AppError("Google authentication failed: " + error.message, 401)
                );
            }
            return;
        }

        try {
            const userExists = await UserService.checkUserExists(email);
            if (userExists) {
                next(new AppError("User already exists", 400));
                return;
            }

            const newUser = await UserService.createUser({
                email,
                password,
                fullName,
            });
            generateToken(res, newUser._id);
            res.status(201).json(
                success({
                    message: "User created successfully",
                    data: true,
                })
            );
        } catch (error: any) {
            logger.error("Error creating user:", error);
            next(new AppError(error.message, 500));
        }
    }

    static async updateUserProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            let user = await UserService.getUserById(req.user!._id);

            if (!user) {
                next(new AppError("User not found", 404));
                return;
            }

            // Ensure profile is always initialized
            if (!user.profile) {
                user.profile = {} as Profile;
            }

            if (req.body.fileKey) {
                user.profile.avatar = req.body.fileKey;
            }

            // Handle profile updates with deep merging
            if (req.body.profile) {
                // Handle regular profile fields
                Object.keys(req.body.profile).forEach((field) => {
                    if (field !== "social") {
                        (user!.profile as Profile)[field as keyof Omit<Profile, "social">] =
                            req.body.profile[field];
                    }
                });

                // Handle social media updates separately
                if (req.body.profile.social) {
                    if (!user.profile.social) {
                        user.profile.social = {} as Social;
                    }

                    Object.keys(req.body.profile.social).forEach((field) => {
                        (user!.profile!.social as Social)[field as keyof Social] =
                            req.body.profile.social[field];
                    });
                }
            }

            // Handle other top-level fields
            Object.keys(req.body).forEach((field) => {
                if (
                    field in User.schema.paths &&
                    field !== "password" &&
                    field !== "profile" &&
                    field !== "email" &&
                    field !== "followersCount" &&
                    field !== "followingCount"
                ) {
                    (user as any)[field as keyof UserType] = req.body[field];
                }
            });

            const updatedUser = await UserService.updateUserById(
                user._id as string,
                user
            );
            if (!updatedUser) {
                next(new AppError("Error updating user profile", 500));
                return;
            }

            res.status(200).json(
                success({
                    data: updatedUser,
                    message: "User Profile updated successfully",
                })
            );
        } catch (error: any) {
            logger.error("Error updating user profile:", error);
            next(new AppError(error.message, 500));
        }
    }

    static async getUserById(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(req.params.id)) {
                next(new AppError("Invalid user ID", 404));
                return;
            }

            const user = await UserService.getUserById(req.params.id);
            if (!user) {
                next(new AppError("User not found", 404));
                return;
            }
            res.status(200).json(
                success({
                    data: user,
                    message: "User fetched successfully",
                })
            );
        } catch (error: any) {
            next(new AppError(error.message, 500));
        }
    }

    static async logoutUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.clearCookie("auth_token", {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
                domain: process.env.NODE_ENV === STAGES.PROD ? ".radiatorforge.suniljangir.site" : undefined,
            });

            res.status(200).json(
                success({
                    data: true,
                    message: "User logged out",
                })
            );
        } catch (error: any) {
            next(new AppError("Internal server error.", 500));
        }
    }
}

export default UserController;
