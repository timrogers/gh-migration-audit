import { AuditorFunctionArgs, AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-actions-self-hosted-runners';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: AuditorFunctionArgs): Promise<AuditorWarning[]> => {
  // TODO: Check what happens if Actions is disabled on GHES and handle that case
  const { data } = await octokit.rest.actions.listSelfHostedRunnersForRepo({
    owner,
    repo,
    per_page: 1,
  });

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.total_count,
          'GitHub Actions self-hosted runner',
          'GitHub Actions self-hosted runners',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
