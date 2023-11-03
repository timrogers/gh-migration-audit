import { type Octokit } from 'octokit';
import { GraphqlRepository } from './types';

interface GraphqlRepositoryResponse {
  repository: GraphqlRepository;
}

export const getRepositoryWithGraphql = async ({
  owner,
  name,
  octokit,
}: {
  owner: string;
  name: string;
  octokit: Octokit;
}): Promise<GraphqlRepository> => {
  const response = (await octokit.graphql(
    `query getRepository($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        discussions(first: 1) {
          totalCount
        }
        rulesets(first: 1) {
          totalCount
        }
        deployKeys {totalCount }
        packages { totalCount }
        deployments { totalCount }
        environments { totalCount }
      }
    }`,
    {
      owner,
      name,
    },
  )) as GraphqlRepositoryResponse;

  return response.repository;
};
