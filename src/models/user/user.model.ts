import { Schema, model } from "mongoose";
import { Profile, Social, UserDocument } from "../../types/user";
import bcrypt from "bcrypt";
import { Model } from "mongoose";

const SocialSchema = new Schema<Social>(
  {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    github: { type: String },
  },
  { _id: false, versionKey: false },
);

const ProfileSchema = new Schema<Profile>(
  {
    bio: { type: String },
    availableForHire: { type: Boolean },
    avatar: { type: String },
    cover: { type: String },
    website: { type: String },
    profession: { type: String },
    social: SocialSchema,
  },
  { _id: false, versionKey: false },
);

// Define User schema with `password` and required fields
const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, select: false },
    profile: ProfileSchema,
    followersCount: { type: Number, default: 0 }, // New field for followers count
    followingCount: { type: Number, default: 0 }, // New field for following count
  },
  { timestamps: true, versionKey: false },
);

// Indexes for fast retrieval
UserSchema.index({ email: 1 }, { unique: true }); // Index on email for fast lookups and uniqueness
UserSchema.index({ fullName: 1 }); // Index on fullName for fast lookups when searching by name

// Password hashing middleware before saving
UserSchema.pre<UserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Password validation method
UserSchema.methods.comparePassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<UserDocument> = model<UserDocument>("User", UserSchema);

export default User;
