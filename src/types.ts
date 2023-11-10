import type { Octokit } from 'octokit';

export interface GraphqlRepository {
  id: string;
  discussions: {
    totalCount: number;
  };
  diskUsage: number;
  deployKeys: {
    totalCount: number;
  };
  packages: {
    totalCount: number;
  };
  deployments: {
    totalCount: number;
  };
  environments: {
    totalCount: number;
  };
  pinnedIssues: {
    totalCount: number;
  };
}

export interface AuditorWarning {
  message: string;
}

export interface RepositoryAuditWarning {
  message: string;
  type: string;
}

export interface AuditWarning {
  message: string;
  type: string;
  name: string;
  owner: string;
}

export interface NameWithOwner {
  owner: string;
  name: string;
}

export type AuditorFunctionArgs = {
  graphqlRepository: GraphqlRepository;
  octokit: Octokit;
  owner: string;
  repo: string;
  gitHubEnterpriseServerVersion: string | undefined;
  logger: Logger;
};

export type AuditorFunction = ({
  graphqlRepository,
  octokit,
  owner,
  repo,
  gitHubEnterpriseServerVersion,
  logger,
}: AuditorFunctionArgs) => Promise<AuditorWarning[]>;

export interface Auditor {
  TYPE: string;
  auditor: AuditorFunction;
}

export interface Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (message: string, meta?: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (message: string, meta?: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (message: string, meta?: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message: string, meta?: any) => unknown;
}
