import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-tag-protection-rules';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repository-tag-protection-rules', () => {
  it('returns a warning if there are tag protection rules', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/tags/protection', [1, 2]);

    const auditorArguments = buildAuditorArguments({
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

  it('returns no warnings if there are no tag protection rules', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/tags/protection', []);

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });
});
