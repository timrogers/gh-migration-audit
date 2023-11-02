import type { Octokit } from 'octokit';

import { AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-dependabot-secrets';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  const { data } = await octokit.rest.dependabot.listRepoSecrets({
    owner,
    repo,
    per_page: 1,
  });

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.total_count,
          'Dependabot secret',
          'Dependabot secrets',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
