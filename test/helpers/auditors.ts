import { AuditorFunctionArgs, GraphqlRepository, Logger } from '../../src/types.js';
import { createOctokit } from '../../src/octokit';
import { buildRepository } from './repositories';
import fetchMock from 'fetch-mock';

type FetchMock = typeof fetchMock;

export const buildAuditorArguments = ({
  graphqlRepositoryOverrides,
  fetchMock,
  gitHubEnterpriseServerVersion,
}: {
  graphqlRepositoryOverrides?: Partial<GraphqlRepository>;
  fetchMock?: FetchMock;
  gitHubEnterpriseServerVersion?: string;
}): AuditorFunctionArgs => {
  const graphqlRepository = buildRepository(graphqlRepositoryOverrides);

  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

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
    gitHubEnterpriseServerVersion,
    logger,
    owner: 'test',
    repo: 'test',
  };
};
