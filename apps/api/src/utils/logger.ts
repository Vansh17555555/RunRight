import winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json() // Structured logs for production
  ),
  transports: [
    new winston.transports.Console({
        // Use readable format for dev, json for prod usually, but mix here for simplicity
        format: process.env.NODE_ENV === 'production' ? json() : combine(colorize(), consoleFormat)
    }),
  ],
});
