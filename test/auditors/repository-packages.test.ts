import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-packages';

describe('repository-packages', () => {
  it('returns a warning if there is 1 package', async () => {
    const graphqlRepository = buildRepository({ packages: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There is 1 package on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns a warning if there are 3 packages', async () => {
    const graphqlRepository = buildRepository({ packages: { totalCount: 3 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There are 3 packages on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no packages', async () => {
    const graphqlRepository = buildRepository({ packages: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
