import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-pinned-issues';

describe('repository-pinned-issues', () => {
  it('returns a warning if there is 1 pinned issue', async () => {
    const graphqlRepository = buildRepository({ pinnedIssues: { totalCount: 1 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message:
          'There is 1 pinned issue on this repository. The issue will be migrated, but it will not remain pinned.',
      },
    ]);
  });

  it('returns a warning if there are 5 pinned issues', async () => {
    const graphqlRepository = buildRepository({ pinnedIssues: { totalCount: 5 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message:
          'There are 5 pinned issues on this repository. The issues will be migrated, but they will not remain pinned.',
      },
    ]);
  });

  it('returns no warnings if there are no pinned issues', async () => {
    const graphqlRepository = buildRepository({ pinnedIssues: { totalCount: 0 } });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
