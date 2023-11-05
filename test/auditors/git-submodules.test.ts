import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/git-submodules';

describe('git-submodules', () => {
  it('returns a warning if there is a .gitmodules file', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/contents/.gitmodules', {
        content: Buffer.from('foo').toString('base64'),
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'The repository seems to use Git submodules. If you are migrating the Git repositories used inside this repository, you will need to update the reference(s) to point to the new location(s).',
      },
    ]);
  });

  it('returns no warnings if there is not a .gitmodules file', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/contents/.gitmodules', 404);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
