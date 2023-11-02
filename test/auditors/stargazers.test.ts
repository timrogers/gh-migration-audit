import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/stargazers';

describe('stargazers', () => {
  it('returns a warning if there are stargazers', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/stargazers', [1, 2, 3]);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          '3 users have starred this repo. Stars will not be transferred as part of a migration.',
      },
    ]);
  });

  it("returns no warnings if there aren't any stargazers", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/stargazers', []);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
