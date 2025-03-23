import { RequestError } from 'octokit';
import { AuditorFunctionArgs, AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-dependabot-secrets';

export const auditor = async ({
  octokit,
  owner,
  repo,
  logger,
}: AuditorFunctionArgs): Promise<AuditorWarning[]> => {
  let data;

  try {
    const response = await octokit.rest.dependabot.listRepoSecrets({
      owner,
      repo,
      per_page: 1,
    });

    data = response.data;
  } catch (error) {
    if (error instanceof RequestError && error.status == 500) {
      logger.warn(
        'Unable to check for Dependabot secrets because the REST API returned `500 Internal Server Error`. This usually means that Dependabot is turned off.',
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
          'Dependabot secret',
          'Dependabot secrets',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
