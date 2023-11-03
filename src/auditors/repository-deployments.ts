import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-deployments';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.deployments.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.deployments.totalCount,
          'There is',
          'There are',
          false,
        )} ${pluralize(
          graphqlRepository.deployments.totalCount,
          'deployment',
          'deployments',
        )} on this repository, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
