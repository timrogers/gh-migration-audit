import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-custom-properties';

export const auditor: AuditorFunction = async ({
  gitHubEnterpriseServerVersion,
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  if (typeof gitHubEnterpriseServerVersion !== 'undefined') {
    return [];
  }

  const { data: customProperties } = await octokit.request(
    'GET /repos/{owner}/{repo}/properties/values',
    {
      owner,
      repo,
    },
  );

  if (customProperties.length > 0) {
    return [
      {
        message: `This repository has one or more custom properties assigned to it, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
