import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-environments';

describe('repository-deploykeys', () => {
  it('returns a warning if there is 1 environment', async () => {
    const graphqlRepository = buildRepository({ environments: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There is 1 environment on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns a warning if there are 3 environments', async () => {
    const graphqlRepository = buildRepository({ environments: { totalCount: 3 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message:
          'There are 3 environments on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no environments', async () => {
    const graphqlRepository = buildRepository({ environments: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
