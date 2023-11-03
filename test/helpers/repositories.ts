import { GraphqlRepository } from '../../src/types.js';

export const buildRepository = (
  overrides?: Partial<GraphqlRepository>,
): GraphqlRepository => {
  return {
    id: 'test',
    rulesets: {
      totalCount: 0,
    },
    discussions: {
      totalCount: 0,
    },
    deployKeys: {
      totalCount: 0,
    },
    deployments: {
      totalCount: 0,
    },
    packages: {
      totalCount: 0,
    },
    environments: {
      totalCount: 0,
    },
    ...overrides,
  };
};
