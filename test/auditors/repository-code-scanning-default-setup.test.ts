import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-code-scanning-default-setup';

describe('repositoryCodeScanningDefaultSetup', () => {
  it('returns a warning if Code Scanning default setup is enabled', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/code-scanning/default-setup', {
        state: 'configured',
        languages: ['javascript', 'javascript-typescript', 'typescript'],
        query_suite: 'default',
        updated_at: '2023-01-01T10:15:44Z',
        schedule: 'weekly',
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has Code Scanning default setup configuration enabled, which will not be migrated',
      },
    ]);
  });

  it('returns no warnings if Code Scanning default setup is not enabled', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/code-scanning/default-setup', {
        state: 'not-configured',
        languages: ['javascript', 'javascript-typescript', 'typescript'],
        query_suite: 'default',
        updated_at: null,
        schedule: null,
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });

  it('returns no warnings if the "Advanced Security must be enabled for this repository to use code scanning." error is returned', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/code-scanning/default-setup', {
        status: 403,
        body: {
          message:
            'Advanced Security must be enabled for this repository to use code scanning.',
        },
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
