import winston from 'winston';
const { combine, timestamp, printf, colorize } = winston.format;

import { Logger } from './types';

// TODO: Figure out how to make ESLint happy with this

const format = printf(({ level, message, timestamp, owner, repo }): string => {
  if (owner && repo) {
    return `${timestamp} ${level} [${owner}/${repo}]: ${message}`;
  } else {
    return `${timestamp} ${level}: ${message}`;
  }
});

const generateLoggerOptions = (verbose: boolean): winston.LoggerOptions => {
  return {
    format: combine(colorize(), timestamp(), format),
    transports: [new winston.transports.Console({ level: verbose ? 'debug' : 'info' })],
  };
};

export const createLogger = (verbose: boolean): Logger =>
  winston.createLogger(generateLoggerOptions(verbose));
