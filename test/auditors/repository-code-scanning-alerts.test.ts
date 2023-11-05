import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-code-scanning-alerts';

describe('repositoryCodeScanningAlerts', () => {
  it('returns a warning if there are Code Scanning alerts', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/code-scanning/alerts?per_page=1', [
        1,
      ]);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has one or more Code Scanning alerts, which will not be migrated.',
      },
    ]);
  });

  it("returns no warnings if there aren't any Code Scanning alerts", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce(
        'https://api.github.com/repos/test/test/code-scanning/alerts?per_page=1',
        [],
      );

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
