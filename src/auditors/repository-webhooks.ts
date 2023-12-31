import type { Octokit } from 'octokit';

import { AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-webhooks';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  const { data } = await octokit.rest.repos.listWebhooks({
    owner,
    repo,
  });

  if (data.length > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.length,
          'webhook',
          'webhooks',
        )}. These will be migrated, but they will be disabled by default, and their secrets will be wiped.`,
      },
    ];
  } else {
    return [];
  }
};
