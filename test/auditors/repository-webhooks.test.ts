import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import repositoryWebhooks from '../../src/auditors/repository-webhooks';

describe('repositoryWebhooks', () => {
  it('returns a warning if there are webhooks', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/hooks', [1, 2, 3]);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await repositoryWebhooks(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has 3 webhooks. These will be migrated, but they will be disabled by default, and their secrets will be wiped.',
        type: 'repository-webhooks',
      },
    ]);
  });

  it("returns no warnings if there aren't any webhooks", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/hooks', []);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await repositoryWebhooks(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
