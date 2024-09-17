import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-check-run-history';

describe('repositoryCheckRunHistory', () => {
  it('returns a warning if there are check runs', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test', {
        default_branch: 'main',
      })
      .getOnce('https://api.github.com/repos/test/test/commits/main/check-suites', {
        total_count: 2,
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has one or more checks. Check run history will not be migrated.',
      },
    ]);
  });

  it("returns no warnings if there aren't any check runs", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test', {
        default_branch: 'main',
      })
      .getOnce('https://api.github.com/repos/test/test/commits/main/check-suites', {
        total_count: 0,
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
