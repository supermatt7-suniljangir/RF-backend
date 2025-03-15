import {Response} from "express";
import jwt from "jsonwebtoken";
import {AppError} from "./responseTypes";
import logger from "../config/logger";
import {STAGES} from "./stages";

const generateToken = (res: Response, _id: any): string => {
    try {
        const token = jwt.sign({_id}, process.env.JWT_SECRET as string, {
            expiresIn: "29d",
        });
        // Update this in your generateToken function
        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: "/",
            domain:"radiatorforge.suniljangir.site"
        });



        return token;
    } catch (error) {
        logger.error(`Error generating token or setting cookie: ${error as Error}`);
        throw new AppError("Error generating token or setting cookie", 500);
    }
};

export default generateToken;
