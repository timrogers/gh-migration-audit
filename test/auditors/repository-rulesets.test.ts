import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-rulesets';

describe('repository-rulesets', () => {
  it('returns a warning if there are rulesets', async () => {
    const graphqlRepository = buildRepository({ rulesets: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message: '1 ruleset applies to this repository, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no rulesets', async () => {
    const graphqlRepository = buildRepository({ discussions: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
