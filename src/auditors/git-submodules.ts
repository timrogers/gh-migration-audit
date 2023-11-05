import type { Octokit, RequestError } from 'octokit';

import { AuditorWarning } from '../types';

export const TYPE = 'git-submodules';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<AuditorWarning[]> => {
  try {
    await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.gitmodules',
    });
  } catch (error) {
    if ((error as RequestError).status === 404) {
      // There is no .gitmodules file, so this repository doesn't seem to use submodules
      return [];
    } else {
      // Some other unexpected error was thrown, which should be bubbled up
      throw error;
    }
  }

  // The repository has a .gitmodules file, so we should surface the warning
  return [
    {
      message:
        'The repository seems to use Git submodules. If you are migrating the Git repositories used inside this repository, you will need to update the reference(s) to point to the new location(s).',
    },
  ];
};
