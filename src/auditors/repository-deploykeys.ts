import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-deploykeys';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.deployKeys.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.deployKeys.totalCount,
          'There is',
          'There are',
          false,
        )} ${pluralize(
          graphqlRepository.deployKeys.totalCount,
          'deploy key',
          'deploy keys',
        )} on this repository, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
