import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-rulesets';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  const { data: rulesets } = await octokit.rest.repos.getRepoRulesets({
    owner,
    repo,
    per_page: 1,
    includes_parents: true,
  });

  if (rulesets.length > 0) {
    return [
      {
        message: `One or more repository or organization rulesets apply to this repository, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
