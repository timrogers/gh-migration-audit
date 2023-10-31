import { AuditWarning, GraphqlRepository } from '../types';

const TYPE = 'repository-rulesets';

export default async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditWarning[]> => {
  if (graphqlRepository.rulesets.totalCount > 0) {
    return [
      {
        message: `${graphqlRepository.rulesets.totalCount} rulesets apply to this repository, which will not be migrated.`,
        type: TYPE,
      },
    ];
  } else {
    return [];
  }
};
