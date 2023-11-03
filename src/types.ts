import type { Octokit } from 'octokit';

export interface GraphqlRepository {
  id: string;
  rulesets: {
    totalCount: number;
  };
  discussions: {
    totalCount: number;
  };
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

export type AuditorFunction = ({
  graphqlRepository,
  octokit,
  owner,
  repo,
}: {
  graphqlRepository: GraphqlRepository;
  octokit: Octokit;
  owner: string;
  repo: string;
}) => Promise<AuditorWarning[]>;

export interface Auditor {
  TYPE: string;
  auditor: AuditorFunction;
}
