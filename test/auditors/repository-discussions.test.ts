import { buildRepository } from '../helpers/repositories';
import repositoryDiscussions from '../../src/auditors/repository-discussions';

describe('repository-discussions', () => {
  it('returns a warning if there are discussions', async () => {
    const graphqlRepository = buildRepository({ discussions: { totalCount: 1 } });
    const warnings = await repositoryDiscussions(graphqlRepository);

    expect(warnings).toEqual([
      {
        message:
          '1 discussions have been created on this repository, which will not be migrated.',
        type: 'repository-discussions',
      },
    ]);
  });

  it('returns no warnings if there are no discussions', async () => {
    const graphqlRepository = buildRepository({ discussions: { totalCount: 0 } });
    const warnings = await repositoryDiscussions(graphqlRepository);

    expect(warnings.length).toEqual(0);
  });
});
