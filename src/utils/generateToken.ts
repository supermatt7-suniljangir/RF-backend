import { Response } from "express";
import { AppError } from "../middlewares/error";
import jwt from "jsonwebtoken";

const generateToken = (res: Response, _id: any): string => {
  try {
    const token = jwt.sign({ _id }, process.env.JWT_SECRET as string, {
      expiresIn: "30d",
    });
    res.cookie("auth_token", token, {
      httpOnly: true, 
      sameSite: "strict", 
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      path: "/", 
    });

    return token; 
  } catch (error) {
    throw new AppError("Error generating token or setting cookie", 500);
  }
};

export default generateToken;
