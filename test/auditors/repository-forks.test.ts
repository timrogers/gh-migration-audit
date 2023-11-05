import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-forks';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repository-forks', () => {
  it('returns a warning if there are forks', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/forks?per_page=1', [1, 2]);

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has one or more forks. The forks will not be migrated automatically with this repository, and if they are migrated separately, they will no longer be connected to the parent repo.',
      },
    ]);
  });

  it('returns no warnings if there are no forks', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/forks?per_page=1', []);

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
