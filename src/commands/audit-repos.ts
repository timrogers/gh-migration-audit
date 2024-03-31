import * as commander from 'commander';
import { createReadStream, existsSync, writeFileSync } from 'fs';
import { stringify } from 'csv-stringify';
import { parse } from '@fast-csv/parse';
import { PostHog } from 'posthog-node';
import crypto from 'crypto';

import {
  actionRunner,
  checkForUpdates,
  logRateLimitInformation,
  pluralize,
} from '../utils';
import VERSION from '../version';
import { createLogger } from '../logger';
import { createOctokit } from '../octokit';
import { AuditWarning, NameWithOwner } from '../types';
import { auditRepositories } from '../repository-auditor';
import {
  MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION,
  getGitHubProductInformation,
  isSupportedGitHubEnterpriseServerVersion,
} from '../github-products';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '../posthog';

const command = new commander.Command();

interface Arguments {
  accessToken?: string;
  baseUrl: string;
  disableTelemetry: boolean;
  inputPath: string;
  outputPath: string | undefined;
  proxyUrl: string | undefined;
  skipUpdateCheck: boolean;
  verbose: boolean;
}

const writeWarningsToCsv = async (
  warnings: AuditWarning[],
  outputPath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    stringify(
      warnings,
      { columns: ['owner', 'name', 'type', 'message'], header: true },
      (err, output) => {
        if (err) {
          reject(err);
        } else {
          writeFileSync(outputPath, output);
          resolve();
        }
      },
    );
  });
};

const readNameWithOwnersFromInputFile = async (
  inputPath: string,
): Promise<NameWithOwner[]> => {
  const nameWithOwners: NameWithOwner[] = [];

  return await new Promise((resolve, reject) => {
    createReadStream(inputPath, 'utf8')
      .pipe(parse({ headers: true }))
      .on('error', reject)
      .on('data', (row) => {
        const rowHeaders = Object.keys(row);

        if (
          rowHeaders.length === 2 &&
          rowHeaders.includes('owner') &&
          rowHeaders.includes('name')
        ) {
          if (row.owner) {
            const { name, owner } = row;
            nameWithOwners.push({ name, owner });
          }
        } else {
          reject(
            new Error(
              'The input CSV file specified with --input-path is invalid. The file should have a header row with the columns `owner` and `name`, followed by a series of rows.',
            ),
          );
        }
      })
      .on('end', () => {
        resolve(nameWithOwners);
      });
  });
};

command
  .name('audit-repos')
  .version(VERSION)
  .description(
    "Audits a list of repos provided in a CSV, identifying data that can't be migrated automatically",
  )
  .option(
    '--access-token <access_token>',
    'The access token used to interact with the GitHub API. This can also be set using the GITHUB_TOKEN environment variable.',
  )
  .option(
    '--base-url <base_url>',
    'The base URL for the GitHub API. You only need to set this if you are auditing a repo that is not currently hosted on GitHub.com.',
    'https://api.github.com',
  )
  .option(
    '--output-path <output_path>',
    'The path to write the audit result CSV to. Defaults to the "repos" followed by the current date and time, e.g. `repos_1698925405325.csv`.',
  )
  .requiredOption(
    '--input-path <input_path>',
    'The path to a input CSV file with a list of repos to audit. The file should have a header row with the columns `owner` and `name`, followed by a series of rows.',
  )
  .option(
    '--proxy-url <proxy_url>',
    'The URL of an HTTP(S) proxy to use for requests to the GitHub API (e.g. `http://localhost:3128`). This can also be set using the PROXY_URL environment variable.',
    process.env.PROXY_URL,
  )
  .option('--verbose', 'Whether to emit detailed, verbose logs', false)
  .option(
    '--disable-telemetry',
    'Disable anonymous telemetry that gives the maintainers of this tool basic information about real-world usage. For more detailed information about the built-in telemetry, see the readme at https://github.com/timrogers/gh-migration-audit.',
    false,
  )
  .option('--skip-update-check', 'Skip automatic check for updates to this tool', false)
  .action(
    actionRunner(async (opts: Arguments) => {
      const {
        accessToken: accessTokenFromArguments,
        baseUrl,
        disableTelemetry,
        inputPath,
        proxyUrl,
        skipUpdateCheck,
        verbose,
      } = opts;

      const logger = createLogger(verbose);

      if (!skipUpdateCheck) checkForUpdates(proxyUrl, logger);

      const accessToken = accessTokenFromArguments || process.env.GITHUB_TOKEN;

      if (!accessToken) {
        throw new Error(
          'You must specify a GitHub access token using the --access-token argument or GITHUB_TOKEN environment variable.',
        );
      }

      const outputPath = opts.outputPath || `repos_${Date.now()}.csv`;

      if (existsSync(outputPath)) {
        throw new Error(
          `The output path, \`${outputPath}\` already exists. Please delete the existing file or specify a different path using the --output-path argument.`,
        );
      }

      if (!existsSync(inputPath)) {
        throw new Error(`The input path, \`${inputPath}\` does not exist.`);
      }

      const octokit = createOctokit(accessToken, baseUrl, proxyUrl, logger);

      const shouldCheckRateLimitAgain = await logRateLimitInformation(logger, octokit);

      if (shouldCheckRateLimitAgain) {
        setInterval(() => {
          void logRateLimitInformation(logger, octokit);
        }, 30_000);
      }

      const nameWithOwners = await readNameWithOwnersFromInputFile(inputPath);

      if (!nameWithOwners.length) {
        throw new Error('The input CSV file does not contain any repos to audit.');
      }

      logger.info(
        `Found ${pluralize(nameWithOwners.length, 'repo', 'repos')} in input CSV file`,
      );

      const { isGitHubEnterpriseServer, gitHubEnterpriseServerVersion } =
        await getGitHubProductInformation(octokit);

      if (isGitHubEnterpriseServer) {
        if (!isSupportedGitHubEnterpriseServerVersion(gitHubEnterpriseServerVersion)) {
          throw new Error(
            `GitHub Enterprise Server ${gitHubEnterpriseServerVersion} is not supported. This tool can only be used with GitHub Enterprise Server ${MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION} and later.`,
          );
        }

        logger.info(
          `Running in GitHub Enterprise Server ${gitHubEnterpriseServerVersion} mode...`,
        );
      } else {
        logger.info('Running in GitHub.com mode...');
      }

      const posthog = new PostHog(POSTHOG_API_KEY, {
        disabled: disableTelemetry,
        host: POSTHOG_HOST,
      });

      posthog.capture({
        distinctId: crypto.randomUUID(),
        event: 'audit_repos_start',
        properties: {
          github_enterprise_server_version: gitHubEnterpriseServerVersion,
          is_github_enterprise_server: isGitHubEnterpriseServer,
          version: VERSION,
        },
      });

      const warnings = await auditRepositories({
        octokit,
        logger,
        nameWithOwners,
        gitHubEnterpriseServerVersion,
      });

      await writeWarningsToCsv(warnings, outputPath);

      logger.info(`Successfully wrote audit CSV to ${outputPath}`);
      await posthog.shutdown();
      process.exit(0);
    }),
  );

export default command;
