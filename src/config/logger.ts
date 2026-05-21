import winston from "winston";

const createLogFormat = (colorize = false) => {
  return winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),

    winston.format.errors({
      stack: true,
    }),

    winston.format.splat(),

    ...(colorize ? [winston.format.colorize({ all: true })] : []),

    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let formattedMeta = "";

      const splat = meta[Symbol.for("splat")];

      if (Array.isArray(splat) && splat.length > 0) {
        formattedMeta = splat
          .map((item) => {
            if (item instanceof Error) {
              return item.stack || item.message;
            }

            if (typeof item === "object") {
              return JSON.stringify(item, null, 2);
            }

            return String(item);
          })
          .join(" ");
      }

      return [`${timestamp} ${level}:`, stack || message, formattedMeta]
        .filter(Boolean)
        .join(" ");
    }),
  );
};

const consoleTransport = new winston.transports.Console({
  format: createLogFormat(true),
});

const fileTransports = [
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5,
    format: createLogFormat(),
  }),

  new winston.transports.File({
    filename: "logs/combined.log",
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5,
    format: createLogFormat(),
  }),
];

const logger = winston.createLogger({
  level: "debug",
  transports: [
    consoleTransport,

    // enable when needed
    // ...fileTransports,
  ],
});

export default logger;
