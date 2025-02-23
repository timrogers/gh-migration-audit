import * as commander from 'commander';
import crypto from 'crypto';
import { existsSync, writeFileSync } from 'fs';
import { stringify } from 'csv-stringify';
import { PostHog } from 'posthog-node';

import { actionRunner, checkForUpdates, logRateLimitInformation } from '../utils';
import VERSION from '../version';
import { createLogger } from '../logger';
import { createOctokit } from '../octokit';
import { RepositoryAuditWarning } from '../types';
import { auditRepository } from '../repository-auditor';
import {
  MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION,
  getGitHubProductInformation,
  isSupportedGitHubEnterpriseServerVersion,
} from '../github-products';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '../posthog';
import { createAuthConfig } from '../auth';

const command = new commander.Command();
const { Option } = commander;

interface Arguments {
  accessToken?: string;
  baseUrl: string;
  disableTelemetry: boolean;
  outputPath: string | undefined;
  owner: string;
  repo: string;
  proxyUrl: string | undefined;
  skipUpdateCheck: boolean;
  verbose: boolean;
  appId?: string | undefined;
  privateKey?: string | undefined;
  appInstallationId?: string | undefined;
}

const writeWarningsToCsv = async (
  warnings: RepositoryAuditWarning[],
  outputPath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    stringify(warnings, { columns: ['type', 'message'], header: true }, (err, output) => {
      if (err) {
        reject(err);
      } else {
        writeFileSync(outputPath, output);
        resolve();
      }
    });
  });
};

command
  .name('audit-repo')
  .version(VERSION)
  .description(
    "Audits a single GitHub repository, identifying data that can't be migrated automatically",
  )
  .addOption(
    new Option(
      '--access-token <access_token>',
      'The access token used to interact with the GitHub API. This can also be set using the GITHUB_TOKEN environment variable.',
    ).env('GITHUB_TOKEN'),
  )
  .addOption(
    new Option(
      '--app-installation-id <app_installation_id>',
      'The installation ID of the GitHub App.',
    ).env('GITHUB_APP_INSTALLATION_ID'),
  )
  .addOption(
    new Option('--app-id <app_id>', 'The App ID of the GitHub App').env('GITHUB_APP_ID'),
  )
  .addOption(
    new Option(
      '--private-key <private_key>',
      'The private key of the GitHub App. Alternatively, use --private-key-file if you have a .pem file. If this is provided, the app ID and installation ID must also be provided.',
    ).env('GITHUB_APP_PRIVATE_KEY'),
  )
  .addOption(
    new Option(
      '--private-key-file <private_key_file>',
      'The private key of the GitHub App. For example, path to a *.pem file you downloaded from the about page of the GitHub App. If this is provided, the app ID and installation ID must also be provided.',
    ).env('GITHUB_APP_PRIVATE_KEY_FILE'),
  )
  .option(
    '--base-url <base_url>',
    "The base URL of the GitHub API, if you're running an audit against a GitHub product other than GitHub.com. For GitHub Enterprise Server, this will be something like `https://github.acme.inc/api/v3`. For GitHub Enterprise Cloud with data residency, this will be `https://api.acme.ghe.com`, replacing `acme` with your own tenant.",
    'https://api.github.com',
  )
  .option(
    '--output-path <output_path>',
    'The path to write the audit result CSV to. Defaults to the specified owner and repo, followed by the current date and time, e.g. `monalisa_octocat_1698925405325.csv`.',
  )
  .requiredOption(
    '--owner <owner>',
    'The login of the user or organization that owns the repository',
  )
  .requiredOption('--repo <repo>', 'The name of the repository')
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
        baseUrl,
        disableTelemetry,
        owner,
        repo,
        proxyUrl,
        skipUpdateCheck,
        verbose,
      } = opts;

      const logger = createLogger(verbose);

      if (!skipUpdateCheck) checkForUpdates(proxyUrl, logger);

      const authConfig = createAuthConfig({ ...opts, logger: logger });

      const outputPath = opts.outputPath || `${owner}_${repo}_${Date.now()}.csv`;

      if (existsSync(outputPath)) {
        throw new Error(
          `The output path, \`${outputPath}\` already exists. Please delete the existing file or specify a different path using the --output-path argument.`,
        );
      }

      const octokit = createOctokit(authConfig, baseUrl, proxyUrl, logger);

      const shouldCheckRateLimitAgain = await logRateLimitInformation(logger, octokit);

      if (shouldCheckRateLimitAgain) {
        setInterval(() => {
          void logRateLimitInformation(logger, octokit);
        }, 30_000);
      }

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
        event: 'audit_repo_start',
        properties: {
          github_enterprise_server_version: gitHubEnterpriseServerVersion,
          is_github_enterprise_server: isGitHubEnterpriseServer,
          version: VERSION,
        },
      });

      logger.info(`Auditing ${owner}/${repo}...`);

      const warnings = await auditRepository({
        octokit,
        owner,
        repo,
        logger,
        gitHubEnterpriseServerVersion,
      });
      await writeWarningsToCsv(warnings, outputPath);

      logger.info(`Successfully wrote audit CSV to ${outputPath}`);
      await posthog.shutdown();
      process.exit(0);
    }),
  );

export default command;
