import semver from 'semver';

import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-dependabot-alerts';

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

  // TODO: Check what happens if Dependabot is disabled on GHES and handle that case
  const { data } = await octokit.rest.dependabot.listAlertsForRepo({
    owner,
    repo,
    per_page: 1,
  });

  if (data.length > 0) {
    return [
      {
        message: `This repository has one or more Dependabot alerts which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
