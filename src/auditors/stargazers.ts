import type { Octokit } from 'octokit';

import { AuditorWarning } from '../types';
import { pluralize } from '../utils';

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
  });

  if (data.length > 0) {
    return [
      {
        message: `${pluralize(
          data.length,
          'user has starred',
          'users have starred',
        )} this repo. Stars will not be transferred as part of a migration.`,
      },
    ];
  } else {
    return [];
  }
};
