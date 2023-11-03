import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-packages';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.packages.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.packages.totalCount,
          'There is',
          'There are',
          false,
        )} ${pluralize(
          graphqlRepository.packages.totalCount,
          'package',
          'packages',
        )} on this repository, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
