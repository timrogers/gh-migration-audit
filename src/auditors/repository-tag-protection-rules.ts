import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-tag-protection-rules';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
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
