import type { Octokit, RequestError } from 'octokit';

import { AuditWarning } from '../types';

const TYPE = 'git-lfs-objects';

export default async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditWarning[]> => {
  let response;

  try {
    response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.gitattributes',
    });
  } catch (error) {
    if ((error as RequestError).status === 404) {
      return [];
    } else {
      throw error;
    }
  }

  const { data } = response;

  if ('content' in data) {
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    if (content.includes('filter=lfs')) {
      return [
        {
          message: `This repository seems to use Git LFS. LFS objects will not be migrated automatically.`,
          type: TYPE,
        },
      ];
    } else {
      return [];
    }
  } else {
    return [];
  }
};
