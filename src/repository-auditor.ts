import type { Octokit } from 'octokit';
import winston from 'winston';

import {
  Auditor,
  AuditWarning,
  GraphqlRepository,
  NameWithOwner,
  RepositoryAuditWarning,
} from './types.js';
import * as repositoryRulesets from './auditors/repository-rulesets';
import * as repositoryDiscussions from './auditors/repository-discussions';
import * as gitLfsObjects from './auditors/git-lfs-objects';
import * as repositoryWebhooks from './auditors/repository-webhooks';
import * as repositoryActionsVariables from './auditors/repository-actions-variables';
import * as repositoryActionsSecrets from './auditors/repository-actions-secrets';
import * as repositoryCodespacesSecrets from './auditors/repository-codespaces-secrets';
import * as repositoryDependabotSecrets from './auditors/repository-dependabot-secrets';
import { getRepositoryWithGraphql } from './repositories';
import { presentError } from './utils';

const DEFAULT_AUDITORS: Auditor[] = [
  repositoryRulesets,
  repositoryDiscussions,
  gitLfsObjects,
  repositoryWebhooks,
  repositoryActionsVariables,
  repositoryActionsSecrets,
  repositoryCodespacesSecrets,
  repositoryDependabotSecrets,
];

export const auditRepositories = async ({
  octokit,
  nameWithOwners,
  logger,
  auditors = DEFAULT_AUDITORS,
}: {
  octokit: Octokit;
  nameWithOwners: NameWithOwner[];
  logger: winston.Logger;
  auditors?: Auditor[];
}): Promise<AuditWarning[]> => {
  const warnings: AuditWarning[] = [];

  for (const { name, owner } of nameWithOwners) {
    const repoWarnings = await auditRepository({
      octokit,
      owner,
      repo: name,
      logger,
      auditors,
    });

    warnings.push(
      ...repoWarnings.map((repoWarning) => ({ ...repoWarning, name, owner })),
    );
  }

  return warnings;
};

export const auditRepository = async ({
  octokit,
  owner,
  repo,
  logger,
  auditors = DEFAULT_AUDITORS,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  logger: winston.Logger;
  auditors?: Auditor[];
}): Promise<RepositoryAuditWarning[]> => {
  const graphqlRepository = await getRepositoryWithGraphql({
    owner,
    name: repo,
    octokit,
  });

  const warnings: RepositoryAuditWarning[] = [];

  for (const auditor of auditors) {
    const auditWarnings = await runAuditor(
      auditor,
      octokit,
      owner,
      repo,
      graphqlRepository,
      logger,
    );
    warnings.push(...auditWarnings);
  }

  return warnings;
};

const runAuditor = async (
  auditor: Auditor,
  octokit: Octokit,
  owner: string,
  repo: string,
  graphqlRepository: GraphqlRepository,
  logger: winston.Logger,
): Promise<RepositoryAuditWarning[]> => {
  try {
    const warnings = await auditor.auditor({ graphqlRepository, octokit, owner, repo });
    return warnings.map((auditorWarning) => ({ ...auditorWarning, type: auditor.TYPE }));
  } catch (e) {
    logger.error(`Auditor \`${auditor.TYPE}\` failed with error: ${presentError(e)}`);
    return [];
  }
};
