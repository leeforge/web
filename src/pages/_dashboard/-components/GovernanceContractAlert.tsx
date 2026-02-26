import type { GovernanceCapability } from '@/api/endpoints/governance-contract.api';
import { Alert, Tag } from 'antd';
import { getGovernanceContract, isGovernanceApiSupported } from '@/api/endpoints/governance-contract.api';

interface GovernanceContractAlertProps {
  capability: GovernanceCapability;
  className?: string;
}

export function GovernanceContractAlert({ capability, className }: GovernanceContractAlertProps) {
  const contract = getGovernanceContract(capability);
  const supported = isGovernanceApiSupported(capability);

  if (!contract) {
    return null;
  }

  return (
    <Alert
      className={className}
      type={supported ? 'success' : 'warning'}
      showIcon
      message={(
        <div className="flex items-center gap-2">
          <span>{contract.label}</span>
          <Tag color={supported ? 'green' : 'orange'}>
            {supported ? '已接入后端' : '前端降级模式'}
          </Tag>
        </div>
      )}
      description={contract.notes}
    />
  );
}

