import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-environments';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.environments.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.environments.totalCount,
          'There is',
          'There are',
          false,
        )} ${pluralize(
          graphqlRepository.environments.totalCount,
          'environment',
          'environments',
        )} on this repository, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
