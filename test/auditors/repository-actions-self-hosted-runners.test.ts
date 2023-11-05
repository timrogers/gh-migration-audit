import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-actions-self-hosted-runners';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repositoryActionsSelfHostedRunners', () => {
  it('returns a warning if there are any self-hosted runners', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/actions/runners?per_page=1', {
        total_count: 10,
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has 10 GitHub Actions self-hosted runners, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no self-hosted runners', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/actions/runners?per_page=1', {
        total_count: 0,
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
