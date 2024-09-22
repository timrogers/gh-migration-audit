import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-tag-protection-rules';
import { buildAuditorArguments } from '../helpers/auditors';
import { MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION } from '../../src/github-products';

describe('repository-tag-protection-rules', () => {
  it('running against GitHub Enterprise Server, returns a warning if there are tag protection rules', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/tags/protection', [1, 2]);

    const auditorArguments = buildAuditorArguments({
      gitHubEnterpriseServerVersion: MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION,
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has one or more tag protection rules, which will not be migrated',
      },
    ]);
  });

  it('running against GitHub Enterprise Server, returns no warnings if there are no tag protection rules', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/tags/protection', []);

    const auditorArguments = buildAuditorArguments({
      gitHubEnterpriseServerVersion: MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION,
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });

  it('no-ops if running against GitHub.com', async () => {
    const auditorArguments = buildAuditorArguments({
      gitHubEnterpriseServerVersion: undefined,
    });
    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
