import { GraphqlRepository } from '../../src/types.js';
import { createOctokit } from '../../src/octokit';
import { createLogger } from 'winston';
import { buildRepository } from './repositories';
import { FetchMockSandbox } from 'fetch-mock';

export const buildAuditorArguments = ({
  graphqlRepositoryOverrides,
  fetchMock,
}: {
  graphqlRepositoryOverrides?: Partial<GraphqlRepository>;
  fetchMock?: FetchMockSandbox;
} = {}) => {
  const graphqlRepository = buildRepository(graphqlRepositoryOverrides);
  const logger = createLogger();

  const octokit = createOctokit(
    'dummy',
    'https://api.github.com',
    undefined,
    logger,
    fetchMock,
  );

  return {
    graphqlRepository,
    octokit,
    owner: 'test',
    repo: 'test',
  };
};
