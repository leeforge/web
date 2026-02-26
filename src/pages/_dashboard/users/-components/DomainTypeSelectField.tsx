import { Form, Select } from 'antd';

export type InvitationDomainType = 'platform' | 'tenant';

interface DomainTypeSelectFieldProps {
  disabled?: boolean;
  onChange?: (value: InvitationDomainType) => void;
}

const DOMAIN_TYPE_OPTIONS: Array<{ label: string; value: InvitationDomainType }> = [
  { label: '平台域（platform）', value: 'platform' },
  { label: '租户域（tenant）', value: 'tenant' },
];

export function DomainTypeSelectField({ disabled, onChange }: DomainTypeSelectFieldProps) {
  return (
    <Form.Item
      name="domainType"
      label="域类型"
      rules={[{ required: true, message: '请选择域类型' }]}
    >
      <Select<InvitationDomainType>
        options={DOMAIN_TYPE_OPTIONS}
        placeholder="请选择域类型"
        disabled={disabled}
        onChange={value => onChange?.(value)}
      />
    </Form.Item>
  );
}
