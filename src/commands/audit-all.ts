import * as commander from 'commander';
import { existsSync, writeFileSync } from 'fs';
import { stringify } from 'csv-stringify';

import { actionRunner, logRateLimitInformation, pluralize } from '../utils';
import VERSION from '../version';
import { createLogger } from '../logger';
import { createOctokit } from '../octokit';
import { AuditorWarning } from '../types';
import { auditRepositories } from '../repository-auditor';

const command = new commander.Command();
const { Option } = commander;

interface Arguments {
  accessToken?: string;
  baseUrl: string;
  outputPath: string | undefined;
  owner: string;
  ownerType: OwnerType;
  proxyUrl: string | undefined;
}

enum OwnerType {
  Organization = 'organization',
  User = 'user',
}

const writeWarningsToCsv = async (
  warnings: AuditorWarning[],
  outputPath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    stringify(warnings, { header: true }, (err, output) => {
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
  .name('audit-all')
  .version(VERSION)
  .description(
    "Audits all of the repositories owned by a specific GitHub organization or user, identifying data that can't be migrated automatically",
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
    'The path to write the audit result CSV to. Defaults to the specified owner followed by the current date and time, e.g. `monalisa_1698925405325.csv`.',
  )
  .requiredOption(
    '--owner <owner>',
    'The login of the user or organization that owns the repositories',
  )
  .addOption(
    new Option('--owner-type <owner_type>', 'The type of the owner of the repositories')
      .choices(['organization', 'user'])
      .default(OwnerType.Organization),
  )
  .option(
    '--proxy-url <proxy_url>',
    'The URL of an HTTP(S) proxy to use for requests to the GitHub API (e.g. `http://localhost:3128`). This can also be set using the PROXY_URL environment variable.',
    process.env.PROXY_URL,
  )
  .action(
    actionRunner(async (opts: Arguments) => {
      const { accessToken, baseUrl, owner, ownerType, proxyUrl } = opts;

      if (!accessToken) {
        throw new Error(
          'You must specify a GitHub access token using the --access-token argument or GITHUB_TOKEN environment variable.',
        );
      }

      const outputPath = opts.outputPath || `${owner}_${Date.now()}.csv`;

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

      logger.info(`Identifying all repos owned by ${owner}...`);

      const repoNames: string[] = [];

      if (ownerType === OwnerType.Organization) {
        const iterator = octokit.paginate.iterator(octokit.rest.repos.listForOrg, {
          org: owner,
        });

        for await (const { data: reposPage } of iterator) {
          for (const repo of reposPage) {
            repoNames.push(repo.name);
          }
        }
      } else {
        const iterator = octokit.paginate.iterator(octokit.rest.repos.listForUser, {
          username: owner,
        });

        for await (const { data: reposPage } of iterator) {
          for (const repo of reposPage) {
            repoNames.push(repo.name);
          }
        }
      }

      logger.info(
        `Found ${pluralize(repoNames.length, 'repo', 'repos')} owned by ${owner}`,
      );

      const nameWithOwners = repoNames.map((name) => ({ owner, name }));

      const warnings = await auditRepositories({ octokit, logger, nameWithOwners });

      await writeWarningsToCsv(warnings, outputPath);

      logger.info(`Successfully wrote audit CSV to ${outputPath}`);
      process.exit(0);
    }),
  );

export default command;
