import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-rulesets';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repository-rulesets', () => {
  it('returns a warning if there are rulesets', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce(
        'https://api.github.com/repos/test/test/rulesets?per_page=1&includes_parents=true',
        [1, 2],
      );

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'One or more repository or organization rulesets apply to this repository, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if there are no rulesets', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce(
        'https://api.github.com/repos/test/test/rulesets?per_page=1&includes_parents=true',
        [],
      );

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
