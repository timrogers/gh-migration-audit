import { AuditorFunction, AuditorWarning } from '../types';
import { RequestError } from 'octokit';

export const TYPE = 'repository-dependabot-alerts';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  try {
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
  } catch (e) {
    if (
      e instanceof RequestError &&
      e.message === 'Dependabot alerts are disabled for this repository.'
    ) {
      return [];
    } else {
      throw e;
    }
  }
};
