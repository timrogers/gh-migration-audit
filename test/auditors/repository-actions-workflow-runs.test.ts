import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-actions-workflow-runs';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repositoryActionsWorkflowRuns', () => {
  it('returns a warning if there are any workflow runs', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/actions/runs?per_page=1', {
        total_count: 10,
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has 10 GitHub Actions workflow runs, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no Actions workflow runs', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/actions/runs?per_page=1', {
        total_count: 0,
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
