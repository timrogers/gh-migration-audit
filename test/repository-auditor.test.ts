import fetchMock from 'fetch-mock';

import { Auditor } from '../src/types';
import { createLogger } from '../src/logger';
import { createOctokit } from '../src/octokit';
import {
  auditRepositories,
  auditRepository,
  DEFAULT_AUDITORS,
} from '../src/repository-auditor';
import { buildRepository } from './helpers/repositories';

const fakeAuditorWithNoWarnings: Auditor = {
  TYPE: 'fake-auditor-with-no-warnings',
  auditor: () => Promise.resolve([]),
};

const fakeAuditorWithWarnings: Auditor = {
  TYPE: 'fake-auditor-with-warnings',
  auditor: () => Promise.resolve([{ message: 'warning' }]),
};

const AUDITORS = [fakeAuditorWithNoWarnings, fakeAuditorWithWarnings];

describe('DEFAULT_AUDITORS', () => {
  it('should contain auditors with unique TYPEs', () => {
    const types = DEFAULT_AUDITORS.map((auditor) => auditor.TYPE);
    const uniqueTypes = new Set(types);

    expect(types.length).toEqual(uniqueTypes.size);
  });
});

describe('auditRepository', () => {
  it('should run each of the auditors and return a list of warnings', async () => {
    const logger = createLogger(false);

    const fetch = fetchMock.sandbox().postOnce('https://api.github.com/graphql', {
      data: { repository: buildRepository() },
    });

    const octokit = createOctokit(
      'dummy',
      'https://api.github.com',
      undefined,
      logger,
      fetch,
    );

    const warnings = await auditRepository({
      octokit,
      owner: 'owner',
      repo: 'repo',
      logger,
      auditors: AUDITORS,
      gitHubEnterpriseServerVersion: undefined,
    });

    expect(warnings).toEqual([
      {
        type: fakeAuditorWithWarnings.TYPE,
        message: 'warning',
      },
    ]);
  });
});

describe('auditRepositories', () => {
  it('should run each of the auditors for each of the repositories and return a list of warnings', async () => {
    const logger = createLogger(false);

    const fetch = fetchMock.sandbox().post('https://api.github.com/graphql', {
      data: { repository: buildRepository() },
    });

    const octokit = createOctokit(
      'dummy',
      'https://api.github.com',
      undefined,
      logger,
      fetch,
    );

    const nameWithOwners = [
      {
        name: 'repo',
        owner: 'owner',
      },
      {
        name: 'repo2',
        owner: 'owner2',
      },
    ];

    const warnings = await auditRepositories({
      octokit,
      nameWithOwners,
      logger,
      auditors: AUDITORS,
      gitHubEnterpriseServerVersion: undefined,
    });

    expect(warnings).toEqual([
      {
        type: fakeAuditorWithWarnings.TYPE,
        message: 'warning',
        name: 'repo',
        owner: 'owner',
      },
      {
        type: fakeAuditorWithWarnings.TYPE,
        message: 'warning',
        name: 'repo2',
        owner: 'owner2',
      },
    ]);
  });
});
