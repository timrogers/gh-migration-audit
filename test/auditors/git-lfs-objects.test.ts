import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import gitLfsObjects from '../../src/auditors/git-lfs-objects';

describe('git-lfs-objects', () => {
  it('returns a warning if there is a .gitattributes file indicating that Git LFS is configured', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/contents/.gitattributes', {
        content: Buffer.from('*.png filter=lfs diff=lfs merge=lfs -text').toString(
          'base64',
        ),
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await gitLfsObjects(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository seems to use Git LFS. LFS objects will not be migrated automatically.',
        type: 'git-lfs-objects',
      },
    ]);
  });

  it('returns no warnings if there is not a .gitattributes file', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/contents/.gitattributes', 404);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await gitLfsObjects(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
