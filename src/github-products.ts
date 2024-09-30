import type { Octokit } from 'octokit';
import { URL } from 'url';
import { Endpoints } from '@octokit/types';
import semver from 'semver';

type DotcomMetaResponse = Endpoints['GET /meta']['response'];

// Octokit's default types target GitHub.com where there is no `installed_version` returned
// from this API. We construct our own type which includes this.
type GhesMetaResponse = DotcomMetaResponse & {
  data: {
    installed_version: string;
  };
};

export const MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION = '3.11.0';

export const isSupportedGitHubEnterpriseServerVersion = (version: string) =>
  semver.gte(version, MINIMUM_SUPPORTED_GITHUB_ENTERPRISE_SERVER_VERSION);

export const getGitHubProductInformation = async (
  octokit: Octokit,
): Promise<
  | {
      isGitHubEnterpriseServer: true;
      gitHubEnterpriseServerVersion: string;
    }
  | {
      isGitHubEnterpriseServer: false;
      gitHubEnterpriseServerVersion: undefined;
    }
> => {
  const isGitHubEnterpriseServer = isGitHubEnterpriseServerBaseUrl(
    octokit.request.endpoint.DEFAULTS.baseUrl,
  );

  if (isGitHubEnterpriseServer) {
    const gitHubEnterpriseServerVersion = await getGitHubEnterpriseServerVersion(octokit);

    return {
      isGitHubEnterpriseServer,
      gitHubEnterpriseServerVersion,
    };
  } else {
    return {
      isGitHubEnterpriseServer,
      gitHubEnterpriseServerVersion: undefined,
    };
  }
};

const isGitHubEnterpriseServerBaseUrl = (baseUrl: string): boolean =>
  !isDotcomBaseUrl(baseUrl) && !isGitHubEnterpriseCloudWithDataResidencyBaseUrl(baseUrl);

const isDotcomBaseUrl = (baseUrl: string): boolean =>
  baseUrl === 'https://api.github.com';

const isGitHubEnterpriseCloudWithDataResidencyBaseUrl = (baseUrl: string): boolean => {
  const { host } = new URL(baseUrl);
  return host.endsWith('ghe.com');
};

const getGitHubEnterpriseServerVersion = async (octokit: Octokit): Promise<string> => {
  const {
    data: { installed_version },
  } = (await octokit.rest.meta.get()) as GhesMetaResponse;

  return installed_version;
};
