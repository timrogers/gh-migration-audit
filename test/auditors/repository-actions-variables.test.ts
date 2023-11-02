import fetchMock from 'fetch-mock';

import { buildAuditorArguments } from '../helpers/auditors';
import { auditor } from '../../src/auditors/repository-actions-variables';

describe('repositoryActionVariables', () => {
  it('returns a warning if there are actions variables', async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/actions/variables?per_page=1', {
        "total_count": 2,
        "variables": [
          {
            "name": "MYVAR",
            "value": "1",
            "created_at": "2023-01-01T10:32:55Z",
            "updated_at": "2023-01-01T10:32:55Z"
          }
        ]        
      });

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([
      {
        message:
          'This repository has 2 action variables, which will not be migrated',
      },
    ]);
  });

  it("returns no warnings if there aren't any repository action variables", async () => {
    const fetch = fetchMock
      .sandbox()
      .getOnce('https://api.github.com/repos/test/test/actions/variables?per_page=1', []);

    const auditorArguments = buildAuditorArguments({ fetchMock: fetch });
    const warnings = await auditor(auditorArguments);

    expect(warnings).toEqual([]);
  });
});
