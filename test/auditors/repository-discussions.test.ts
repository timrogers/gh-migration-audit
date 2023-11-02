import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-discussions';

describe('repository-discussions', () => {
  it('returns a warning if there are discussions', async () => {
    const graphqlRepository = buildRepository({ discussions: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message:
          '1 discussion has been created on this repository, which will not be migrated.',
      },
    ]);
  });

  it('returns no warnings if there are no discussions', async () => {
    const graphqlRepository = buildRepository({ discussions: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
