import {Router} from "express";
import userRoutes from "./userRoutes";
import uploadRoutes from "./uploaderRoutes";
import searchRoutes from "./serachRoutes";
import commentsRoutes from "./commentsRoutes";
import likesRoutes from "./likesRoutes";
import bookmarksRoutes from "./bookmarksRoutes";
import followRoutes from "./followRoutes";
import toolsRoutes from "./toolsRoutes";
import projectRoutes from "./projectRoutes";
import connectRoutes from "./connectRoutes";

const routerV1 = Router();

routerV1.use("/users", userRoutes);
routerV1.use("/projects", projectRoutes);
routerV1.use("/upload", uploadRoutes);
routerV1.use("/search", searchRoutes);
routerV1.use("/comments", commentsRoutes);
routerV1.use("/likes", likesRoutes);
routerV1.use("/tools", toolsRoutes);
routerV1.use("/bookmarks", bookmarksRoutes);
routerV1.use("/follow", followRoutes);
routerV1.use("/connect", connectRoutes);

export default routerV1;
