import { Octokit, RequestError } from 'octokit';

import { AuditorWarning } from '../types';

export const TYPE = 'git-lfs-objects';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  let response;

  try {
    response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.gitattributes',
    });
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
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
        },
      ];
    } else {
      return [];
    }
  } else {
    return [];
  }
};
