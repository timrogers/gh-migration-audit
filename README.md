# gh-migration-audit

A [GitHub CLI](https://cli.github.com/) [extension](https://cli.github.com/manual/gh_extension) for auditing GitHub repositories to highlight data that cannot be automatically migrated using [GitHub's migration tools](https://docs.github.com/en/migrations/overview/migration-paths-to-github)

You can use this tool to identify data that will be lost, or which you'll need to migrate manually, when migrating data away from:

- GitHub.com, including GitHub Enterprise Cloud (GHEC)
- [GitHub Enterprise Cloud with data residency](https://github.com/newsroom/press-releases/data-residency-in-the-eu) 
- GitHub Enterprise Server (GHES) v3.11 onwards

to another GitHub target.

The results from audits with this tool are non-exhaustive - they won't identify every possible kind of data loss from a migration - but the goal is to get you 95% of the way there.

## What unmigratable repository data can this tool detect?

- Actions secrets
- Actions variables
- Code Scanning alerts
- Code Scanning analyses
- Code Scanning [default setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning)
- Codespaces secrets
- Custom properties
- Dependabot alerts
- Dependabot secrets
- Deploy keys
- Deployments
- Discussions
- Environments
- Forks
- Git LFS objects
- Git submodules
- Packages
- Pages custom domain configuration
- Pinned issues
- Release assets which are too large
- Rulesets
- Secret Scanning alerts
- Self-hosted runners
- Stars
- Tag protection rules
- Watchers
- Webhooks
- Workflow runs

It will also warn you if your repository is large (over 1GB), and may be slow or difficult to migrate.

## Installation

Make sure you've got the [GitHub CLI](https://cli.github.com/) installed. If you haven't, you can install it by following the instructions [here](https://github.com/cli/cli#installation).

Once `gh` is ready and available on your machine, you can install this extension by running `gh extension install timrogers/gh-migration-audit`.

You can check that the extension is installed and working by running `gh migration-audit --help`.

## Usage

### Audit a single repo

`gh migration-audit audit-repo` will audit a single GitHub repository and output a CSV file with information about data that cannot be migrated automatically.

You'll need an access token token with appropriate permissions. The extension won't use your existing login session for the GitHub CLI. You'll need a classic token with the `repo` scope, [authorized for SSO](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on) if applicable.

You can audit a repo like this:

```bash
gh migration-audit audit-repo \
    # A GitHub access token with the permissions described above. This can also be configured using the `GITHUB_TOKEN` environment variable.
    --access-token GITHUB_TOKEN \
    # The login of the user or organization that owns the repository
    --owner monalisa \
    # The name of the repository
    --repo octocat \
    # OPTIONAL: The path to write the audit result CSV to. Defaults to the specified owner and repo, followed by the current date and time, e.g. `monalisa_octocat_1698925405325.csv
    --output-path octocat.csv \
    # OPTIONAL: The base URL of the GitHub API, if you're running an audit against a GitHub product other than GitHub.com. For GitHub Enterprise Server, this will be something like `https://github.acme.inc/api/v3`. For GitHub Enterprise Cloud with data residency, this will be `https://api.acme.ghe.com`, replacing `acme` with your own tenant.
    --base-url https://github.acme.inc/api/v3 \
    # OPTIONAL: The URL of an HTTP(S) proxy to use for requests to the GitHub API (e.g. `http://localhost:3128`). This can also be set using the PROXY_URL environment variable.
    --proxy-url https://10.0.0.1:3128 \
    # OPTIONAL: Whether to emit detailed, verbose logs
    --verbose \
    # OPTIONAL: Disable anonymous telemetry that gives the maintainers of this tool basic information about real-world usage
    --disable-telemetry \
    # OPTIONAL: Skip automatic check for updates to this tool
    --skip-update-check
```

The tool will audit your repo, and then write a CSV file to the `--output-path` with the results.

### Audit all repos owned by an organization or user

`gh migration-audit audit-all` will audit all GitHub repositories owned by a specific organization or user, and output a CSV file with information about data that cannot be migrated automatically.

You can run the command like this:

```bash
gh migration-audit audit-all \
    # A GitHub access token with the permissions described above. This can also be configured using the `GITHUB_TOKEN` environment variable.
    --access-token GITHUB_TOKEN \
    # The login of the user or organization that owns the repositories.
    --owner monalisa \
    # The type of the owner of the repositories - either `user` or `organization`.
    --owner-type user \
    # OPTIONAL: The path to write the audit result CSV to. Defaults to the specified owner followed by the current date and time, e.g. `monalisa_1698925405325.csv`.
    --output-path octocat.csv \
    # OPTIONAL: The base URL of the GitHub API, if you're running an audit against a GitHub product other than GitHub.com. For GitHub Enterprise Server, this will be something like `https://github.acme.inc/api/v3`. For GitHub Enterprise Cloud with data residency, this will be `https://api.acme.ghe.com`, replacing `acme` with your own tenant.
    --base-url https://github.acme.inc/api/v3 \
    # OPTIONAL: The URL of an HTTP(S) proxy to use for requests to the GitHub API (e.g. `http://localhost:3128`). This can also be set using the PROXY_URL environment variable.
    --proxy-url https://10.0.0.1:3128 \
    # OPTIONAL: Whether to emit detailed, verbose logs
    --verbose \
    # OPTIONAL: Disable anonymous telemetry that gives the maintainers of this tool basic information about real-world usage
    --disable-telemetry \
    # OPTIONAL: Skip archived repositories when auditing all repositories owned by the specified user or organization
    --skip-archived \
    # OPTIONAL: Skip automatic check for updates to this tool
    --skip-update-check
```

The tool will audit all of the repos, and then write a CSV file to the `--output-path` with the results.

### Audit a specific set of repos

`gh migration-audit audit-repos` will audit a specific list of repos specified in a CSV file, and output a CSV file with information about data that cannot be migrated automatically.

To use this command, you'll need to start by preparing your input CSV. It should have exactly two columns, `owner` and `name`. On each row, `owner` should have the name of the user or organization that owns the repo, and `name` should have the name of the repo, e.g.:

```
owner,name
monalisa,octocat
timrogers,gh-migration-audit
```

You can run the command like this:

```bash
gh migration-audit audit-repos \
    # A GitHub access token with the permissions described above. This can also be configured using the `GITHUB_TOKEN` environment variable.
    --access-token GITHUB_TOKEN \
    # The path to a input CSV file with a list of repos to audit. The file should have a header row with the columns `owner` and `name`, followed by a series of rows.
    --input-path input.csv \
    # OPTIONAL: The path to write the audit result CSV to. Defaults to the "repos" followed by the current date and time, e.g. `repos_1698925405325.csv`.
    --output-path octocat.csv \
    # OPTIONAL: The base URL of the GitHub API, if you're running an audit against a GitHub product other than GitHub.com. For GitHub Enterprise Server, this will be something like `https://github.acme.inc/api/v3`. For GitHub Enterprise Cloud with data residency, this will be `https://api.acme.ghe.com`, replacing `acme` with your own tenant.
    --base-url https://github.acme.inc/api/v3 \
    # OPTIONAL: The URL of an HTTP(S) proxy to use for requests to the GitHub API (e.g. `http://localhost:3128`). This can also be set using the PROXY_URL environment variable.
    --proxy-url https://10.0.0.1:3128 \
    # OPTIONAL: Whether to emit detailed, verbose logs
    --verbose \
    # OPTIONAL: Disable anonymous telemetry that gives the maintainers of this tool basic information about real-world usage
    --disable-telemetry \
    # OPTIONAL: Skip automatic check for updates to this tool
    --skip-update-check
```

The tool will audit all of the repos, and then write a CSV file to the `--output-path` with the results.

### Authentication

For the commands [audit-all](#audit-all-repos-owned-by-an-organization-or-user), [audit-repos](#audit-a-specific-set-of-repos) and [audit-repo](#audit-a-single-repo), this tool supports two types of authentication: `token` which expects a Personal Access Token or `installation` which uses a GitHub App installation for authentication. The tool will automatically determine the authentication type based on the provided parameters.

- If a `--access-token` or `GITHUB_TOKEN` is provided it is assumed that the [token](#token-authentication) approach should be taken.
- If a `--app-installation-id` or `GITHUB_APP_INSTALLATION_ID` is provided it is assumed that the [installation](#installation-authentication) approach should be taken. This approach also requires that an `--app-id` and also `--private-key` be provided in addition to the `--app-installation-id`. 

#### Token Authentication

By default, the extension expects an access token with appropriate scopes to be provided with the `--access-token` argument or `GITHUB_ACCESS_TOKEN` environment variable.

```bash
gh migration-audit audit-repo \
    # A GitHub access token with the permissions described above. This can also be configured using the `GITHUB_TOKEN` environment variable.
    --access-token GITHUB_TOKEN \
    # The login of the user or organization that owns the repository
    --owner monalisa \
    # The name of the repository
    --repo octocat
```

#### Installation Authentication

Instead of [token authentication](#token-authentication), installation authentication can be used by providing values for `--app-id`, `--private-key`, and `--app-installation-id`. Use of environment variables is also supported by providing `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_APP_INSTALLATION_ID`.

Installation Authentication uses a `GitHub App` to access resources on behalf of a user in an organization and can provide longer-lived integration. A [personal access token](#token-authentication) is great for short-lived scripts but if you have a large organization you are trying to audit you should consider using a GitHub App instead. Additionally, a personal access token is associated with a user and can cause the process to fail if the user no longer has access to the resources you are auditing. A GitHub App is not dependent on a user.

```bash
gh migration-audit audit-repo \
    # The GitHub app ID
    --app-id GITHUB_APP_ID \
    # The GitHub app private key or path to a .pem file that contains the private key
    --private-key GITHUB_APP_PRIVATE_KEY \
    # The GitHub app installation ID
    --app-installation-id GITHUB_APP_INSTALLATION_ID \
    # The login of the user or organization that owns the repository
    --owner monalisa \
    # The name of the repository
    --repo octocat
```

## GitHub Enterprise Server (GHES) support

This tool works with GitHub Enterprise Server, and __supports all [GitHub Enterprise Server versions](https://docs.github.com/en/enterprise-server/admin/all-releases) currently supported by GitHub__. GitHub Enterprise Server versions are supported for approximately a year from release.

At the time of writing, the earliest supported version of GitHub Enterprise Server is 3.7. When running against GitHub Enterprise Server, the tool will check that the version is supported.

You may be able to run audits against an older GitHub Enterprise Server version with an older version of `gh-migration-audit`:

- To run audits against GitHub Enterprise Server 3.6, use v0.4.1 or earlier

## Contributing

### Adding a new auditor

If you identify a piece of data that isn't automatically migrated which isn't detected by this tool, you can write an *auditor* to generate a migration warning. Here's what you need to do:

1. Figure out how to detect the data that can't be migrated using GitHub's REST or GraphQL API
1. If the data is returned on the `Repository` object in the GraphQL API, and that GraphQL query is supported across all supported GitHub Enterprise Server versions (>= 3.6), update the GraphQL query in `src/repositories.ts` to fetch that data, and then update the `GraphqlRepository` type in `src/types.ts` in line with the change
1. Create a TypeScript file in `src/auditors` for your auditor, with a sensible name, copying an existing auditor. `repository-packages.ts` is a good one to use as a template for a simple auditor using GraphQL data. For a more complex example with GitHub Enterprise Server version checks, logging, REST API requests and error handling, see `repository-dependabot-alerts.ts`.
1. Update your new auditor to check for unmigratable data and return a warning if there is data which can't be migrated. You may be able to use GraphQL data from step 2, or you can make a fresh API request from your auditor using the `octokit`, `owner` and `repo` passed to the function.
1. Write a unit test for your auditor in `test/auditors`, using an existing one as a template.
1. Update `DEFAULT_AUDITORS` in `src/repository-auditor.ts`, importing and adding the auditor you created
1. Create a pull request with your changes, including evidence of your functional testing to make sure the auditor works on. If possible, please also test with the oldest supported GitHub Enterprise Server version (v3.7).

## Telemetry

This extension includes basic, anonymous telemetry to give the maintainers information about real-world usage. This data is limited to:

- The number of executions of each command
- The versions of GitHub Enterprise Server being used
- The versions of the extension currently in use

You can disable all telemetry by specifying the `--disable-telemetry` argument.