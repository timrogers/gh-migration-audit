import type { Octokit } from 'octokit';
import winston from 'winston';

import {
  Auditor,
  AuditWarning,
  GraphqlRepository,
  RepositoryAuditWarning,
} from './types.js';
import * as repositoryRulesets from './auditors/repository-rulesets.js';
import * as repositoryDiscussions from './auditors/repository-discussions.js';
import * as gitLfsObjects from './auditors/git-lfs-objects.js';
import * as repositoryWebhooks from './auditors/repository-webhooks.js';
import * as repositoryActionsVariables from './auditors/repository-actions-variables.js';
import { getRepositoryWithGraphql } from './repositories.js';
import { presentError } from './utils.js';

const AUDITORS: Auditor[] = [
  repositoryRulesets,
  repositoryDiscussions,
  gitLfsObjects,
  repositoryWebhooks,
  repositoryActionsVariables
];

interface NameWithOwner {
  owner: string;
  name: string;
}

export const auditRepositories = async ({
  octokit,
  nameWithOwners,
  logger,
}: {
  octokit: Octokit;
  nameWithOwners: NameWithOwner[];
  logger: winston.Logger;
}): Promise<AuditWarning[]> => {
  const warnings: AuditWarning[] = [];

  for (const { name, owner } of nameWithOwners) {
    const repoWarnings = await auditRepository({ octokit, owner, repo: name, logger });

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
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  logger: winston.Logger;
}): Promise<RepositoryAuditWarning[]> => {
  const graphqlRepository = await getRepositoryWithGraphql({
    owner,
    name: repo,
    octokit,
  });

  const warnings: RepositoryAuditWarning[] = [];

  for (const auditor of AUDITORS) {
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
