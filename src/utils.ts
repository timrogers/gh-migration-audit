import { type Octokit } from 'octokit';
import { RequestError } from '@octokit/request-error';
import semver from 'semver';

import { Logger } from './types';
import { createOctokit } from './octokit';
import VERSION from './version';

const RED_ESCAPE_SEQUENCE = '\x1b[31m';
const RESET_ESCAPE_SEQUENCE = '\x1b[0m';

export const checkForUpdates = async (
  proxyUrl: string | undefined,
  logger: Logger,
): Promise<void> => {
  const octokit = createOctokit(
    { auth: undefined },
    'https://api.github.com',
    proxyUrl,
    logger,
  );

  try {
    const { data: release } = await octokit.rest.repos.getLatestRelease({
      owner: 'timrogers',
      repo: 'gh-migration-audit',
    });

    if (semver.gt(release.tag_name, VERSION)) {
      logger.warn(
        `The version of gh-migration-audit you're running, v${VERSION}, is out of date. You can update to the latest version, ${release.tag_name} by running \`gh extension upgrade timrogers/gh-migration-audit\`.`,
      );
    } else {
      logger.info(
        `You are running the latest version of gh-migration-audit, v${VERSION}.`,
      );
    }
  } catch (e) {
    logger.error(`Error checking for updates: ${presentError(e)}`);
  }
};

export const logRateLimitInformation = async (
  logger: Logger,
  octokit: Octokit,
): Promise<boolean> => {
  try {
    const restRateLimitResponse = await octokit.rest.rateLimit.get();
    const restResetsAt = new Date(restRateLimitResponse.data.rate.reset * 1_000);

    logger.info(
      `GitHub REST rate limit: ${restRateLimitResponse.data.rate.used}/${
        restRateLimitResponse.data.rate.limit
      } used - resets at ${restResetsAt.toISOString()}`,
    );

    const graphqlRateLimitResponse = (await octokit.graphql(
      'query { rateLimit { limit remaining resetAt } }',
    )) as { rateLimit: { limit: number; remaining: number; resetAt: string } };
    const graphqlUsedRateLimit =
      graphqlRateLimitResponse.rateLimit.limit -
      graphqlRateLimitResponse.rateLimit.remaining;

    logger.info(
      `GitHub GraphQL rate limit: ${graphqlUsedRateLimit}/${graphqlRateLimitResponse.rateLimit.limit} used - resets at ${graphqlRateLimitResponse.rateLimit.resetAt}`,
    );

    return true;
  } catch (e) {
    if (e instanceof RequestError && e.message === 'Rate limiting is not enabled.') {
      logger.info(`GitHub rate limit is disabled.`);
      return false;
    } else {
      logger.error(`Error checking GitHub rate limit: ${presentError(e)}`);
      return true;
    }
  }
};

export const presentError = (e: unknown): string => {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
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
