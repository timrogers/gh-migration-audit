import fetchMock from 'fetch-mock';
import { auditor } from '../../src/auditors/repository-pages-customdomain';
import { buildAuditorArguments } from '../helpers/auditors';

describe('repository-pages-customdomain', () => {
  it('returns a warning if a cname is configured', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/pages', {
        url: 'https://api.github.com/repos/test/testt/pages',
        status: 'built',
        cname: 'example.com',
        custom_404: false,
        html_url: 'https://automatic-barnacle-e23rfdew3.pages.github.io/',
        build_type: 'legacy',
        source: { branch: 'main', path: '/' },
        public: false,
        protected_domain_state: 'verified',
        pending_domain_unverified_at: null,
        https_enforced: true,
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has a custom domain specified. The pages settings will be migrated but not the custom domain (cname) configuration.',
      },
    ]);
  });

  it('returns no warnings if there is no cname configured', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/pages', {
        url: 'https://api.github.com/repos/test/testt/pages',
        status: 'built',
        cname: null,
        custom_404: false,
        html_url: 'https://automatic-barnacle-e23rfdew3.pages.github.io/',
        build_type: 'legacy',
        source: { branch: 'main', path: '/' },
        public: false,
        protected_domain_state: 'verified',
        pending_domain_unverified_at: null,
        https_enforced: true,
      });

    const auditorArguments = buildAuditorArguments({
      fetchMock: fetch,
    });

    const warnings = await auditor(auditorArguments);

    expect(warnings.length).toEqual(0);
  });

  it('returns no warnings if pages are not configured', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/pages', 404);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
