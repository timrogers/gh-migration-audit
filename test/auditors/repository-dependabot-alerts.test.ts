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

  it('no-ops if running against GitHub Enterprise Server <3.8', async () => {
    const auditorArguments = buildAuditorArguments({
      gitHubEnterpriseServerVersion: '3.7.3',
    });
    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });

  it('runs if running against GitHub Enterprise Server >=3.8', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/dependabot/alerts?per_page=1', {
        total_count: 0,
        variables: [],
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
      gitHubEnterpriseServerVersion: '3.8.0',
    });
    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
