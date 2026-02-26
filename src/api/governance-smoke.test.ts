import { describe, expect, it } from 'bun:test';
import {
  getGovernanceContract,
  getGovernanceContracts,
  isGovernanceApiSupported,
} from './endpoints/governance-contract.api';
import { getProjectList } from './endpoints/project.api';
import { getQuotaList } from './endpoints/quota.api';
import { getShareGrantList } from './endpoints/share-grant.api';

describe('governance api smoke', () => {
  it('exposes capability contract matrix', () => {
    const contracts = getGovernanceContracts();
    expect(contracts.length).toBeGreaterThan(0);

    const projectContract = getGovernanceContract('project');
    expect(projectContract?.capability).toBe('project');
    expect(isGovernanceApiSupported('project')).toBe(false);
    expect(isGovernanceApiSupported('role-binding')).toBe(true);
    expect(isGovernanceApiSupported('audit')).toBe(false);
  });

  it('returns graceful unavailable errors for unsupported governance APIs', async () => {
    await expect(getProjectList()).rejects.toBeTruthy();
    await expect(getShareGrantList()).rejects.toBeTruthy();
    await expect(getQuotaList()).rejects.toBeTruthy();
  });
});
