import { RequestError } from 'octokit';
import { AuditorFunctionArgs, AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-actions-secrets';

export const auditor = async ({
  octokit,
  owner,
  repo,
  logger,
}: AuditorFunctionArgs): Promise<AuditorWarning[]> => {
  let data;

  try {
    const response = await octokit.rest.actions.listRepoSecrets({
      owner,
      repo,
      per_page: 1,
    });

    data = response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error) {
    if (error instanceof RequestError && error.status == 500) {
      logger.warn(
        'Unable to check for Actions secrets because the REST API returned `500 Internal Server Error`. This usually means that Actions is turned off.',
      );
      return [];
    } else {
      throw error;
    }
  }

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.total_count,
          'GitHub Actions secret',
          'GitHub Actions secrets',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
