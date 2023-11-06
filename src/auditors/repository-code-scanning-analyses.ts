import { RequestError } from 'octokit';
import { AuditorFunction, AuditorWarning } from '../types';

export const TYPE = 'repository-code-scanning-analyses';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  try {
    const { data } = await octokit.rest.codeScanning.listRecentAnalyses({
      owner,
      repo,
      per_page: 1,
    });

    if (data.length > 0) {
      return [
        {
          message: `This repository has one or more Code Scanning analyses, which will not be migrated`,
        },
      ];
    } else {
      return [];
    }
  } catch (e) {
    if (e instanceof RequestError && e.message === 'no analysis found') {
      return [];
    } else {
      throw e;
    }
  }
};
