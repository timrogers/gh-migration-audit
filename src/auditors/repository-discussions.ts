import { AuditWarning, GraphqlRepository } from '../types';

const TYPE = 'repository-discussions';

export default async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditWarning[]> => {
  if (graphqlRepository.discussions.totalCount > 0) {
    return [
      {
        message: `${graphqlRepository.discussions.totalCount} discussions have been created on this repository, which will not be migrated.`,
        type: TYPE,
      },
    ];
  } else {
    return [];
  }
};
