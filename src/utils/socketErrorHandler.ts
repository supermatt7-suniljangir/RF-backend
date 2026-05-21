// socketErrorHandling.ts
import logger from "../config/logger";
import { Server } from "socket.io";

export const setupSocketErrorHandling = (io: Server) => {
  io.engine.on("connection_error", (err) => {
    logger.error({
      type: "SOCKET_ENGINE_CONNECTION_ERROR",
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  io.on("error", (err) => {
    logger.error({
      type: "SOCKET_SERVER_ERROR",
      error: err,
    });
  });
};
