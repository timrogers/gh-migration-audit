import { AuditorFunctionArgs, AuditorWarning } from '../types';
import { pluralize } from '../utils';

export const TYPE = 'repository-actions-workflow-runs';

export const auditor = async ({
  octokit,
  owner,
  repo,
}: AuditorFunctionArgs): Promise<AuditorWarning[]> => {
  // TODO: Check what happens if Actions is disabled on GHES and handle that case
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 1,
  });

  if (data.total_count > 0) {
    return [
      {
        message: `This repository has ${pluralize(
          data.total_count,
          'GitHub Actions workflow run',
          'GitHub Actions workflow runs',
        )}, which will not be migrated`,
      },
    ];
  } else {
    return [];
  }
};
