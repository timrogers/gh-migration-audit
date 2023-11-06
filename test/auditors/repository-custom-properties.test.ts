import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-custom-properties';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repository-custom-properties', () => {
  it('returns a warning if there are custom properties', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/properties/values', [1, 2]);

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has one or more custom properties assigned to it, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no custom properties', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/properties/values', []);

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });

  it('no-ops if running against GitHub Enterprise Server', async () => {
    const auditorArguments = buildAuditorArguments({
      gitHubEnterpriseServerVersion: '3.10.0',
    });
    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
