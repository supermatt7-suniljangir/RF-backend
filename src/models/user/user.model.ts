// models/User.ts
import { Schema, model, Document } from "mongoose";
import { UserType, Profile, Social, UserDocument } from "../../types/user";
import bcrypt from "bcrypt";
import { Model } from "mongoose";

const socialSchema = new Schema<Social>(
  {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    github: { type: String },
  },
  { _id: false, versionKey: false }
);

// Define Profile schema
const profileSchema = new Schema<Profile>(
  {
    bio: { type: String },
    availableForHire: { type: Boolean },
    avatar: { type: String },
    cover: { type: String },
    followers: { type: Number },
    following: { type: Number },
    website: { type: String },
    phone: { type: String },
    social: socialSchema,
  },
  { _id: false, versionKey: false }
);

// Define User schema with `password` and required fields
const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, select: false }, // Password with select: false to exclude from queries by default
    profile: profileSchema,
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }], // Array of references to Project documents
  },
  { timestamps: true, versionKey: false }
);

// Password hashing middleware before saving
userSchema.pre<UserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
// Password validation method
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User: Model<UserDocument> = model<UserDocument>("User", userSchema);
export default User;
