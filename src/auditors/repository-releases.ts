import { AuditorFunction, AuditorWarning } from '../types';
import { filesize } from 'filesize';

export const TYPE = 'repository-releases';

const RELEASE_ASSETS_WARNING_THRESHOLD_IN_BYTES = 5 * 1000 * 1000 * 1000; // 5 GB

export const auditor: AuditorFunction = async ({
  octokit,
  owner,
  repo,
}): Promise<AuditorWarning[]> => {
  const releasesIterator = octokit.paginate.iterator(
    'GET /repos/{owner}/{repo}/releases',
    {
      owner,
      repo,
      per_page: 100,
    },
  );

  let releaseAssetsTotalSizeInBytes = 0;

  for await (const { data: releases } of releasesIterator) {
    const releaseAssets = releases.flatMap((release) => release.assets);

    const releaseAssetsPageTotalInBytes = releaseAssets.reduce(
      (total, asset) => total + asset.size,
      0,
    );

    releaseAssetsTotalSizeInBytes += releaseAssetsPageTotalInBytes;
  }

  if (releaseAssetsTotalSizeInBytes >= RELEASE_ASSETS_WARNING_THRESHOLD_IN_BYTES) {
    return [
      {
        message: `Your repository includes more than ${filesize(
          RELEASE_ASSETS_WARNING_THRESHOLD_IN_BYTES,
        )} of release assets. This may slow down your migration, or block it by taking you over the migration tool's file size limit. If you're using GitHub Enterprise Importer, you can skip migrating releases with the \`--skip-releases\` command line option.`,
      },
    ];
  } else {
    return [];
  }
};
