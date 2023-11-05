import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-deployments';

describe('repository-packages', () => {
  it('returns a warning if there is 1 deployment', async () => {
    const graphqlRepository = buildRepository({ deployments: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There is 1 deployment on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns a warning if there are 3 deployments', async () => {
    const graphqlRepository = buildRepository({ deployments: { totalCount: 3 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: 'There are 3 deployments on this repository, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no deployments', async () => {
    const graphqlRepository = buildRepository({ deployments: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
