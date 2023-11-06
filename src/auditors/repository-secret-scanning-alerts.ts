import { RequestError } from 'octokit';
import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-secret-scanning-alerts';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  try {
    const { data: alerts } = await octokit.rest.secretScanning.listAlertsForRepo({
      owner,
      repo,
      per_page: 1,
    });

    if (alerts.length > 0) {
      return [
        {
          message: `This repository has one or more secret scanning alerts. These alerts and their states will not be migrated, so it is likely that the same secrets will be detected again, and then you'll have to resolve them.`,
        },
      ];
    } else {
      return [];
    }
  } catch (e) {
    if (
      e instanceof RequestError &&
      e.message === 'Secret scanning is disabled on this repository.'
    ) {
      return [];
    } else {
      throw e;
    }
  }
};
