import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-tag-protection-rules';

export const auditor: AuditorFunction = async ({
  gitHubEnterpriseServerVersion,
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  // Tag protection rules are no longer supported on GitHub.com
  if (typeof gitHubEnterpriseServerVersion === 'undefined') {
    return [];
  }

  const { data: alerts } = await octokit.rest.repos.listTagProtection({
    owner,
    repo,
  });

  if (alerts.length > 0) {
    return [
      {
        message: `This repository has one or more tag protection rules, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
