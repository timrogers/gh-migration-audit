import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-check-run-history';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  const {
    data: { default_branch: defaultBranch },
  } = await octokit.rest.repos.get({ owner, repo });

  const { data } = await octokit.rest.checks.listSuitesForRef({
    owner,
    repo,
    ref: defaultBrnch,
  });

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has one or more checks. Check run history will not be migated.`,
      },
    ];
  } else {
    return [];
  }
};
