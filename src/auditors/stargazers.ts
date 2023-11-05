import type { Octokit } from 'octokit';

import { AuditorWarning } from '../types';

export const TYPE = 'stargazers';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  const { data } = await octokit.rest.activity.listStargazersForRepo({
    owner,
    repo,
    per_page: 1,
  });

  if (data.length > 0) {
    return [
      {
        message: `One or more users have starred this repo. Stars will not be transferred as part of a migration.`,
      },
    ];
  } else {
    return [];
  }
};
