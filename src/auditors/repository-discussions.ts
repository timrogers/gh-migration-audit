import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-discussions';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.discussions.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.discussions.totalCount,
          'discussion has',
          'discussions have',
        )} been created on this repository, which will not be migrated.`,
      },
    ];
  } else {
    return [];
  }
};
