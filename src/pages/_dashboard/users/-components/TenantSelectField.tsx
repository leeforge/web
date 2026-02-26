import { Form, Select } from 'antd';

interface TenantOption {
  label: string;
  value: string;
}

interface TenantSelectFieldProps {
  visible: boolean;
  loading?: boolean;
  options: TenantOption[];
}

export function TenantSelectField({ visible, loading, options }: TenantSelectFieldProps) {
  if (!visible) {
    return null;
  }

  return (
    <Form.Item
      name="domainKey"
      label="租户"
      rules={[{ required: true, message: '请选择租户' }]}
    >
      <Select
        showSearch
        optionFilterProp="label"
        options={options}
        loading={loading}
        placeholder="请选择租户"
      />
    </Form.Item>
  );
}
