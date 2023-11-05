import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-deploykeys';

describe('repository-deploykeys', () => {
  it('returns a warning if there is 1 deploy keys', async () => {
    const graphqlRepository = buildRepository({ deployKeys: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There is 1 deploy key on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns a warning if there are 3 deploy keys', async () => {
    const graphqlRepository = buildRepository({ deployKeys: { totalCount: 3 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There are 3 deploy keys on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no deploy keys', async () => {
    const graphqlRepository = buildRepository({ deployKeys: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
