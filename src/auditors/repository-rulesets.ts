import { AuditWarning, GraphqlRepository } from '../types';
import { pluralize } from './helpers';

const TYPE = 'repository-rulesets';

export default async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditWarning[]> => {
  if (graphqlRepository.rulesets.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.rulesets.totalCount,
          'ruleset applies',
          'rulesets apply',
        )} to this repository, which will not be migrated`,
        type: TYPE,
      },
    ];
  } else {
    return [];
  }
};
