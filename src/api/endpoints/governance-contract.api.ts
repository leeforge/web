import type { ApiError, ApiResponse } from '../types';
import { BusinessError } from '../types';

export type GovernanceCapability
  = | 'project'
    | 'project-membership'
    | 'role-binding'
    | 'share-grant'
    | 'quota'
    | 'audit'
    | 'tenant-mode';

export interface GovernanceContract {
  capability: GovernanceCapability;
  label: string;
  supported: boolean;
  documentedPaths: string[];
  notes: string;
}

const GOVERNANCE_CONTRACTS: GovernanceContract[] = [
  {
    capability: 'project',
    label: '项目管理',
    supported: false,
    documentedPaths: [],
    notes: 'Swagger 仍未提供项目实体管理接口，当前保留前端治理占位与降级提示。',
  },
  {
    capability: 'project-membership',
    label: '项目成员管理',
    supported: false,
    documentedPaths: [],
    notes: 'Swagger 仍未提供项目成员关系接口，当前保留前端治理占位与降级提示。',
  },
  {
    capability: 'role-binding',
    label: '角色绑定策略',
    supported: true,
    documentedPaths: ['/users', '/users/{id}/roles'],
    notes: '已对接用户角色绑定接口（subjectType=user）。project/group 维度绑定待后端补齐。',
  },
  {
    capability: 'share-grant',
    label: '共享授权',
    supported: false,
    documentedPaths: [],
    notes: 'Swagger 仍未提供共享授权接口，当前保留前端治理占位与降级提示。',
  },
  {
    capability: 'quota',
    label: '配额管理',
    supported: false,
    documentedPaths: [],
    notes: 'Swagger 仍未提供配额接口，当前保留前端治理占位与降级提示。',
  },
  {
    capability: 'audit',
    label: '治理审计',
    supported: false,
    documentedPaths: [],
    notes: 'Swagger 仍未提供统一治理审计接口，审计中心页面已下线。',
  },
  {
    capability: 'tenant-mode',
    label: '租户模式配置',
    supported: false,
    documentedPaths: [],
    notes: 'Swagger 仍未提供租户模式配置读写接口，当前采用本地治理配置预览模式。',
  },
];

const GOVERNANCE_CONTRACT_MAP = new Map<GovernanceCapability, GovernanceContract>(
  GOVERNANCE_CONTRACTS.map(contract => [contract.capability, contract]),
);

export function getGovernanceContracts() {
  return GOVERNANCE_CONTRACTS;
}

export function getGovernanceContract(capability: GovernanceCapability) {
  return GOVERNANCE_CONTRACT_MAP.get(capability);
}

export function isGovernanceApiSupported(capability: GovernanceCapability) {
  return Boolean(getGovernanceContract(capability)?.supported);
}

export function unsupportedGovernanceApi<T>(capability: GovernanceCapability): Promise<ApiResponse<T>> {
  const contract = getGovernanceContract(capability);
  const error: ApiError = {
    code: 501,
    status: 501,
    name: 'GovernanceEndpointUnavailable',
    message: contract
      ? `${contract.label}：${contract.notes}`
      : '治理能力接口未就绪',
  };
  return Promise.reject(new BusinessError(error));
}
