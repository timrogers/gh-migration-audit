import { RequestError } from 'octokit';
import { AuditorFunctionArgs, AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-actions-self-hosted-runners';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: AuditorFunctionArgs): Promise<AuditorWarning[]> => {
  try {
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
  } catch (e) {
    if (e instanceof RequestError && e.status === 404) {
      // GHES instances return 404 if Actions isn't enabled
      return [];
    } else {
      throw e;
    }
  }
};
