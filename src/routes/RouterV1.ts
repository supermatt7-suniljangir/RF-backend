import { Router } from "express";
import userRoutes from "./userRoutes";
import uploadRoutes from "./uploaderRoutes";
import searchRoutes from "./serachRoutes";
import commentsRoutes from "./commentsRoutes";
import likesRoutes from "./likesRoutes";
import bookmarksRoutes from "./bookmarksRoutes";
import toolsRoutes from "./toolsRoutes";
import ProjectRoutes from "./projectRoutes";

const routerV1 = Router();

routerV1.use("/users", userRoutes);
routerV1.use("/projects", ProjectRoutes);
routerV1.use("/upload", uploadRoutes);
routerV1.use("/search", searchRoutes);
routerV1.use("/comments", commentsRoutes);
routerV1.use("/likes", likesRoutes);
routerV1.use("/tools", toolsRoutes);
routerV1.use("/bookmarks", bookmarksRoutes);

export default routerV1;
