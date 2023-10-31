import type { Octokit } from 'octokit';

export interface GraphqlRepository {
  id: string;
  rulesets: {
    totalCount: number;
  };
  discussions: {
    totalCount: number;
  };
}

export interface AuditWarning {
  message: string;
  type: string;
}

export type Auditor = ({
  graphqlRepository,
  octokit,
  owner,
  repo,
}: {
  graphqlRepository: GraphqlRepository;
  octokit: Octokit;
  owner: string;
  repo: string;
}) => Promise<AuditWarning[]>;
