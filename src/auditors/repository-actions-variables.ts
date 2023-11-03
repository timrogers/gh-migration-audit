import semver from 'semver';

import { AuditorFunction, AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-actions-variables';

export const auditor: AuditorFunction = async ({
  gitHubEnterpriseServerVersion,
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  if (
    typeof gitHubEnterpriseServerVersion !== 'undefined' &&
    semver.lt(gitHubEnterpriseServerVersion, '3.8.0')
  ) {
    return [];
  }

  const { data } = await octokit.rest.actions.listRepoVariables({
    owner,
    repo,
    per_page: 1,
  });

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.total_count,
          'GitHub Actions variable',
          'GitHub Actions variables',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
