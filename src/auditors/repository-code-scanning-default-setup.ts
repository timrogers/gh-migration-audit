import { RequestError } from 'octokit';
import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-code-scanning-default-setup';

const CODE_SCANNING_DISABLED_MESSAGES = [
  'Advanced Security must be enabled for this repository to use code scanning.',
];

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  try {
    const { data } = await octokit.rest.codeScanning.getDefaultSetup({
      owner,
      repo,
    });

    if (data.state === 'configured') {
      return [
        {
          message:
            'This repository has Code Scanning default setup configuration enabled, which will not be migrated',
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
