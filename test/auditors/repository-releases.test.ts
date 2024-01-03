import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-releases';

describe('repositoryReleases', () => {
  it('returns no warnings if there are no releases', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/releases?per_page=100', []);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });

  it('returns no warnings if the releases have less than 5GB of assets', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/releases?per_page=100', [
        {
          assets: [
            {
              size: 1000000000,
            },
          ],
        },
      ]);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });

  it('returns a warning if the releases have more than 5GB of assets', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/releases?per_page=100', [
        {
          assets: [
            {
              size: 6 * 1000000000,
            },
          ],
        },
      ]);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          "Your repository includes more than 5 GB of release assets. This may slow down your migration, or block it by taking you over the migration tool's file size limit. If you're using GitHub Enterprise Importer, you can skip migrating releases with the `--skip-releases` command line option.",
      },
    ]);
  });
});
