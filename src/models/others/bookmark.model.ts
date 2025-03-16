import { Document, Schema, model } from "mongoose";
import { IBookmark } from "../../types/others";

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  },
  { timestamps: true, versionKey: false },
);

const Bookmark = model("Bookmark", BookmarkSchema);
export default Bookmark;
