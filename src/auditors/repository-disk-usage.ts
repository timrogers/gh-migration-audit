import { AuditorWarning, GraphqlRepository } from '../types';
import { filesize } from 'filesize';

export const TYPE = 'repository-disk-usage';

const kilobytesToBytes = (kilobytes: number): number => kilobytes * 1_000;

// 1GB
const THRESHOLD_IN_KILOBYTES = 1_000_000;
const THRESHOLD_IN_BYTES = kilobytesToBytes(THRESHOLD_IN_KILOBYTES);

export const auditor = async ({
  graphqlRepository,
}: {
  graphqlRepository: GraphqlRepository;
}): Promise<AuditorWarning[]> => {
  if (graphqlRepository.diskUsage >= THRESHOLD_IN_KILOBYTES) {
    const diskUsageInBytes = kilobytesToBytes(graphqlRepository.diskUsage);

    return [
      {
        message: `This repository consumes ${filesize(
          diskUsageInBytes,
        )} of disk space. Repositories larger than ${filesize(
          THRESHOLD_IN_BYTES,
        )} can be slow or difficult to migrate.`,
      },
    ];
  } else {
    return [];
  }
};
