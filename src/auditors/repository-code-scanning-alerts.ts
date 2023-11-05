import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-code-scanning-alerts';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  const { data } = await octokit.rest.codeScanning.listAlertsForRepo({
    owner,
    repo,
    per_page: 1,
  });

  if (data.length > 0) {
    return [
      {
        message: `This repository has one or more Code Scanning alerts, which will not be migrated.`,
      },
    ];
  } else {
    return [];
  }
};
