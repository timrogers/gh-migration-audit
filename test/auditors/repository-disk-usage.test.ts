import { buildRepository } from '../helpers/repositories';
import { auditor } from '../../src/auditors/repository-disk-usage';

describe('repository-disk-usage', () => {
  it('returns a warning if the repository is larger than 1GB', async () => {
    const graphqlRepository = buildRepository({ diskUsage: 2_000_000 });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings).toEqual([
      {
        message:
          'This repository consumes 2 GB of disk space. Repositories larger than 1 GB can be slow or difficult to migrate.',
      },
    ]);
  });

  it('does not return a warning if the repository is smaller than 1GB', async () => {
    const graphqlRepository = buildRepository({ diskUsage: 999_999 });
    const warnings = await auditor({ graphqlRepository });

    expect(warnings.length).toEqual(0);
  });
});
