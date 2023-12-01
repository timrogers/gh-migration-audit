import { AuditorFunction, AuditorWarning } from '../types';
import { RequestError } from 'octokit';

export const TYPE = 'repository-pages-customdomain';

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  let response;
  try {
    response = await octokit.rest.repos.getPages({
      owner,
      repo,
    });
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return [];
    } else {
      throw error;
    }
  }

  const pages = response.data;

  if (pages.cname != null) {
    return [
      {
        message: `This repository has a custom domain specified for GitHub Pages. The Pages settings will be migrated, but not the custom domain (CNAME) configuration.`,
      },
    ];
  } else {
    return [];
  }
};
