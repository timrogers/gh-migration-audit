import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-forks';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  const { data: forks } = await octokit.rest.repos.listForks({
    owner,
    repo,
    per_page: 1,
  });

  if (forks.length > 0) {
    return [
      {
        message: `This repository has one or more forks. The forks will not be migrated automatically with this repository, and if they are migrated separately, they will no longer be connected to the parent repo.`,
      },
    ];
  } else {
    return [];
  }
};
