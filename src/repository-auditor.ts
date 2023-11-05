import type { Octokit } from 'octokit';

import {
  Auditor,
  AuditWarning,
  GraphqlRepository,
  Logger,
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
import * as repositoryDeployKeys from './auditors/repository-deploy-keys';
import * as repositoryPackages from './auditors/repository-packages';
import * as repositoryDeployments from './auditors/repository-deployments';
import * as repositoryEnvironments from './auditors/repository-environments';
import * as repositoryCodeScanningAnalyses from './auditors/repository-code-scanning-analyses';
import * as repositoryCodeScanningAlerts from './auditors/repository-code-scanning-alerts';
import * as repositoryDependabotAlerts from './auditors/repository-dependabot-alerts';
import * as repositoryActionsWorkflowRuns from './auditors/repository-actions-workflow-runs';
import * as repositoryActionsSelfHostedRunners from './auditors/repository-actions-self-hosted-runners';
import * as repoositorySecretScanningAlerts from './auditors/repository-secret-scanning-alerts';
import * as repositoryCustomProperties from './auditors/repository-custom-properties';
import * as repositoryTagProtectionRules from './auditors/repository-tag-protection-rules';
import * as watchers from './auditors/watchers';
import * as repositoryForks from './auditors/repository-forks';
import { getRepositoryWithGraphql } from './repositories';
import { presentError, wrapLogger } from './utils';

export const DEFAULT_AUDITORS: Auditor[] = [
  repositoryRulesets,
  repositoryDiscussions,
  gitLfsObjects,
  repositoryWebhooks,
  repositoryActionsVariables,
  repositoryActionsSecrets,
  repositoryCodespacesSecrets,
  repositoryDependabotSecrets,
  repositoryDeployKeys,
  repositoryPackages,
  repositoryDeployments,
  repositoryEnvironments,
  repositoryCodeScanningAnalyses,
  repositoryCodeScanningAlerts,
  repositoryDependabotAlerts,
  repositoryActionsWorkflowRuns,
  repositoryActionsSelfHostedRunners,
  repoositorySecretScanningAlerts,
  repositoryCustomProperties,
  watchers,
  repositoryTagProtectionRules,
  repositoryForks,
];

export const auditRepositories = async ({
  octokit,
  nameWithOwners,
  logger,
  auditors = DEFAULT_AUDITORS,
  gitHubEnterpriseServerVersion,
}: {
  octokit: Octokit;
  nameWithOwners: NameWithOwner[];
  logger: Logger;
  auditors?: Auditor[];
  gitHubEnterpriseServerVersion: string | undefined;
}): Promise<AuditWarning[]> => {
  const warnings: AuditWarning[] = [];

  for (const { name, owner } of nameWithOwners) {
    const repoWarnings = await auditRepository({
      octokit,
      owner,
      repo: name,
      logger,
      auditors,
      gitHubEnterpriseServerVersion,
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
  gitHubEnterpriseServerVersion,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  logger: Logger;
  auditors?: Auditor[];
  gitHubEnterpriseServerVersion: string | undefined;
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
      gitHubEnterpriseServerVersion,
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
  logger: Logger,
  gitHubEnterpriseServerVersion: string | undefined,
): Promise<RepositoryAuditWarning[]> => {
  const repositoryLogger = wrapLogger(logger, owner, repo);

  repositoryLogger.debug(`Running auditor ${auditor.TYPE}`);

  try {
    const warnings = await auditor.auditor({
      graphqlRepository,
      octokit,
      owner,
      repo,
      gitHubEnterpriseServerVersion,
      logger: repositoryLogger,
    });
    return warnings.map((auditorWarning) => ({ ...auditorWarning, type: auditor.TYPE }));
  } catch (e) {
    repositoryLogger.error(
      `Auditor \`${auditor.TYPE}\` failed for ${owner}/${repo} with error: ${presentError(
        e,
      )}`,
    );
    return [];
  }
};
