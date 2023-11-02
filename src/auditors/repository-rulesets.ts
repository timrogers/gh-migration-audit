import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-rulesets';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.rulesets.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.rulesets.totalCount,
          'ruleset applies',
          'rulesets apply',
        )} to this repository, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
