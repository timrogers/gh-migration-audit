import type { Octokit } from 'octokit';

import { AuditorWarning } from '../types';

export const TYPE = 'watchers';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  const { data } = await octokit.rest.activity.listWatchersForRepo({
    owner,
    repo,
  });

  if (data.length > 0) {
    return [
      {
        message:
          'One or more users are watching this repo. Watchers will not be transferred as part of a migration.',
      },
    ];
  } else {
    return [];
  }
};
