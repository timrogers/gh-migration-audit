import { type Octokit } from 'octokit';
import { RequestError } from '@octokit/request-error';
import { GraphqlResponseError } from '@octokit/graphql';

import { Logger } from './types';

const RED_ESCAPE_SEQUENCE = '\x1b[31m';
const RESET_ESCAPE_SEQUENCE = '\x1b[0m';

export const logRateLimitInformation = async (
  logger: Logger,
  octokit: Octokit,
): Promise<void> => {
  try {
    const graphqlRateLimitResponse = (await octokit.graphql(
      'query { rateLimit { limit remaining resetAt } }',
    )) as { rateLimit: { limit: number; remaining: number; resetAt: string } | null };

    // Rate limiting may be disabled on GHES, in which case this returns null
    if (graphqlRateLimitResponse.rateLimit) {
      const graphqlUsedRateLimit =
        graphqlRateLimitResponse.rateLimit.limit -
        graphqlRateLimitResponse.rateLimit.remaining;

      logger.info(
        `GitHub GraphQL rate limit: ${graphqlUsedRateLimit}/${graphqlRateLimitResponse.rateLimit.limit} used - resets at ${graphqlRateLimitResponse.rateLimit.resetAt}`,
      );
    }
  } catch (e) {
    logger.error(`Error checking GitHub rate limit: ${presentError(e)}`);
  }
};

export const presentError = (e: unknown): string => {
  if (typeof e === 'string') return e;
  if (e instanceof RequestError) return e.message;
  if (e instanceof GraphqlResponseError) return e.message;
  return JSON.stringify(e);
};

const actionErrorHandler = (error: Error): void => {
  console.log(error);
  console.error([RED_ESCAPE_SEQUENCE, error.message, RESET_ESCAPE_SEQUENCE].join(''));
  process.exit(1);
};

// @ts-expect-error - This is a hack to make the actionRunner function work
export const actionRunner = (fn: (...args) => Promise<void>) => {
  //@ts-expect-error - This is a hack to make the actionRunner function work
  return async (...args) => await fn(...args).catch(actionErrorHandler);
};

export const pluralize = (
  count: number,
  singular: string,
  plural: string,
  includeCount = true,
): string =>
  [includeCount ? count.toString() : null, count == 1 ? singular : plural]
    .filter((x) => x)
    .join(' ');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoggerFn = (message: string, ...meta: any[]) => unknown;

const wrapLoggerFn =
  (fn: LoggerFn, owner: string, repo: string): LoggerFn =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (message: string, meta: any[]) =>
    fn(message, { ...meta, owner, repo });

export const wrapLogger = (logger: Logger, owner: string, repo: string): Logger => ({
  debug: wrapLoggerFn(logger.debug, owner, repo),
  info: wrapLoggerFn(logger.info, owner, repo),
  warn: wrapLoggerFn(logger.warn, owner, repo),
  error: wrapLoggerFn(logger.warn, owner, repo),
});
