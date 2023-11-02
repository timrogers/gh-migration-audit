import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-codespaces-secrets';

describe('repositoryCodespacesSecrets', () => {
  it('returns a warning if there are codespaces secrets', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/codespaces/secrets?per_page=1', {
        total_count: 2,
        secrets: [
          {
            name: 'MYSECRET',
            created_at: '2023-01-01T16:21:27Z',
            updated_at: '2023-01-01T16:21:27Z',
          },
        ],
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has 2 GitHub Codespaces secrets, which will not be migrated',
      },
    ]);
  });

  it("returns no warnings if there aren't any repository codespace secrets", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/codespaces/secrets?per_page=1', {
        total_count: 0,
        secrets: [],
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
