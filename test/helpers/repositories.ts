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
    ...overrides,
  };
};
