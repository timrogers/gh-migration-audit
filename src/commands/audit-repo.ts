import * as commander from 'commander';
import { existsSync, writeFileSync } from 'fs';
import { stringify } from 'csv-stringify';

import { actionRunner, logRateLimitInformation } from '../utils';
import VERSION from '../version';
import { createLogger } from '../logger';
import { createOctokit } from '../octokit';
import { RepositoryAuditWarning } from '../types';
import { auditRepository } from '../repository-auditor';

const command = new commander.Command();

interface Arguments {
  accessToken?: string;
  baseUrl: string;
  outputPath: string | undefined;
  owner: string;
  repo: string;
  proxyUrl: string | undefined;
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
  .option(
    '--access-token <access_token>',
    'The access token used to interact with the GitHub API. This can also be set using the GITHUB_TOKEN environment variable.',
    process.env.GITHUB_TOKEN,
  )
  .option(
    '--base-url <base_url>',
    'The base URL for the GitHub API. You only need to set this if you are auditing a repo that is not currently hosted on GitHub.com.',
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
  .action(
    actionRunner(async (opts: Arguments) => {
      const { accessToken, baseUrl, owner, repo, proxyUrl } = opts;

      if (!accessToken) {
        throw new Error(
          'You must specify a GitHub access token using the --access-token argument or GITHUB_TOKEN environment variable.',
        );
      }

      const outputPath = opts.outputPath || `${owner}_${repo}_${Date.now()}.csv`;

      if (existsSync(outputPath)) {
        throw new Error(
          `The output path, \`${outputPath}\` already exists. Please delete the existing file or specify a different path using the --output-path argument.`,
        );
      }

      const logger = createLogger(true);
      const octokit = createOctokit(accessToken, baseUrl, proxyUrl, logger);

      void logRateLimitInformation(logger, octokit);

      setInterval(() => {
        void logRateLimitInformation(logger, octokit);
      }, 30_000);

      logger.info(`Auditing ${owner}/${repo}...`);

      const warnings = await auditRepository({ octokit, owner, repo, logger });
      await writeWarningsToCsv(warnings, outputPath);

      logger.info(`Successfully wrote audit CSV to ${outputPath}`);
      process.exit(0);
    }),
  );

export default command;
