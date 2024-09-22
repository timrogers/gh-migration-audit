import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-dependabot-alerts';

describe('repositoryDependabotAlerts', () => {
  it('returns a warning if there are Dependabot alerts', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/dependabot/alerts?per_page=1', [
        1,
      ]);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has one or more Dependabot alerts which will not be migrated',
      },
    ]);
  });

  it("returns no warnings if there aren't any Dependabot alerts", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/dependabot/alerts?per_page=1', []);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });

  it('returns no warnings if Dependabot alerts are disabled for the repo', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/dependabot/alerts?per_page=1', {
        status: 400,
        body: {
          message: 'Dependabot alerts are disabled for this repository.',
        },
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
