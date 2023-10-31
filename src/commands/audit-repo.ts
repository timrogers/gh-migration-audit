import * as commander from 'commander';
import { existsSync, writeFileSync } from 'fs';
import { stringify } from 'csv-stringify';
import type { Octokit } from 'octokit';

import { actionRunner, logRateLimitInformation } from '../utils.js';
import VERSION from '../version.js';
import { createLogger } from '../logger.js';
import { createOctokit } from '../octokit.js';
import { getRepositoryWithGraphql } from '../repositories.js';
import repositoryRulesets from '../auditors/repository-rulesets.js';
import { AuditWarning, Auditor, GraphqlRepository } from '../types.js';
import repositoryDiscussions from '../auditors/repository-discussions.js';

const command = new commander.Command();

interface Arguments {
  accessToken?: string;
  baseUrl: string;
  outputPath: string;
  owner: string;
  repo: string;
  proxyUrl: string | undefined;
}

const AUDITORS: Auditor[] = [repositoryRulesets, repositoryDiscussions];

const runAuditors = async (
  graphqlRepository: GraphqlRepository,
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<AuditWarning[]> => {
  const warnings: AuditWarning[] = [];

  for (const auditor of AUDITORS) {
    warnings.push(...(await auditor({ graphqlRepository, octokit, owner, repo })));
  }

  return warnings;
};

const writeWarningsToCsv = async (
  warnings: AuditWarning[],
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
    'The path to write the audit result CSV to',
    'output.csv',
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
      const { accessToken, baseUrl, outputPath, owner, repo, proxyUrl } = opts;

      if (!accessToken) {
        throw new Error(
          'You must specify a GitHub access token using the --access-token argument or GITHUB_TOKEN environment variable.',
        );
      }

      if (existsSync(outputPath)) {
        throw new Error(
          `The output path, \`${outputPath}\` already exists. Please delete the existing file or specify a different path using the --output-path argument.`,
        );
      }

      const logger = createLogger(true);
      const octokit = createOctokit(accessToken, baseUrl, proxyUrl);

      logger.info(`Auditing ${owner}/${repo}...`);

      void logRateLimitInformation(logger, octokit);
      setInterval(() => {
        void logRateLimitInformation(logger, octokit);
      }, 30_000);

      const graphqlRepository = await getRepositoryWithGraphql({
        owner,
        name: repo,
        octokit,
      });
      const warnings = await runAuditors(graphqlRepository, octokit, owner, repo);
      await writeWarningsToCsv(warnings, outputPath);

      logger.info(`Successfully wrote audit CSV to ${outputPath}`);
      process.exit(0);
    }),
  );

export default command;
