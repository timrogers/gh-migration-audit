import { AuditorWarning, GraphqlRepository } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-pinned-issues';

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.pinnedIssues.totalCount > 0) {
    return [
      {
        message: `${pluralize(
          graphqlRepository.pinnedIssues.totalCount,
          'There is',
          'There are',
          false,
        )} ${pluralize(
          graphqlRepository.pinnedIssues.totalCount,
          'pinned issue',
          'pinned issues',
        )} on this repository, while the issues are migrated the pinning will not`,
      },
    ];
  } else {
    return [];
  }
};
