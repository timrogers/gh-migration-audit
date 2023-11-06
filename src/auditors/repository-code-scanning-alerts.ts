import { RequestError } from 'octokit';
import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-code-scanning-alerts';

const CODE_SCANNING_DISABLED_MESSAGES = [
  'Advanced Security must be enabled for this repository to use code scanning.',
  'no analysis found',
];

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  try {
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
  } catch (e) {
    if (
      e instanceof RequestError &&
      CODE_SCANNING_DISABLED_MESSAGES.includes(e.message)
    ) {
      return [];
    } else {
      throw e;
    }
  }
};
