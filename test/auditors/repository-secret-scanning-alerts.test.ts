import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-secret-scanning-alerts';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repository-secret-scanning-alerts', () => {
  it('returns a warning if there are secret scanning alerts', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce(
        'https://api.github.com/repos/test/test/secret-scanning/alerts?per_page=1',
        [1, 2],
      );

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          "This repository has one or more secret scanning alerts. These alerts and their states will not be migrated, so it is likely that the same secrets will be detected again, and then you'll have to resolve them.",
      },
    ]);
  });

  it('returns no warnings if there are no secret scanning alerts', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce(
        'https://api.github.com/repos/test/test/secret-scanning/alerts?per_page=1',
        [],
      );

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });

  it('returns no warnings if the "no analysis found" error is returned because Secret Scanning is not enabled', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce(
        'https://api.github.com/repos/test/test/secret-scanning/alerts?per_page=1',
        {
          status: 400,
          body: {
            message: 'Secret scanning is disabled on this repository.',
          },
        },
      );

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
