import type { Octokit } from 'octokit';

import { AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-codespaces-secrets';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  const { data } = await octokit.rest.codespaces.listRepoSecrets({
    owner,
    repo,
    per_page: 1,
  });

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.total_count,
          'GitHub Codespaces secret',
          'GitHub Codespaces secrets',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
