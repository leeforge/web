import type { Organization } from '@/api/endpoints/organization.api';
import { Card, Col, Descriptions, Empty, Row } from 'antd';
import { useState } from 'react';
import { OrganizationMemberQuickAdd } from './OrganizationMemberQuickAdd';
import { OrganizationTree } from './OrganizationTree';

/**
 * 组织架构管理页面
 */
export function OrganizationPage() {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  return (
    <div className="h-full">
      <Row gutter={16} className="h-full">
        <Col span={8} className="h-full">
          <Card className="h-full">
            <OrganizationTree onSelect={setSelectedOrganization} />
          </Card>
        </Col>
        <Col span={16} className="h-full">
          <Card
            title={selectedOrganization
              ? `${selectedOrganization.name} - 组织详情`
              : '请选择组织'}
            className="h-full"
          >
            {selectedOrganization
              ? (
                  <>
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="组织名称">{selectedOrganization.name}</Descriptions.Item>
                      <Descriptions.Item label="组织编码">{selectedOrganization.code}</Descriptions.Item>
                      <Descriptions.Item label="父级组织 ID">{selectedOrganization.parentId || '-'}</Descriptions.Item>
                      <Descriptions.Item label="层级">{selectedOrganization.level ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="路径">{selectedOrganization.path || '-'}</Descriptions.Item>
                      <Descriptions.Item label="排序">{selectedOrganization.sort ?? 0}</Descriptions.Item>
                      <Descriptions.Item label="创建时间">{selectedOrganization.createdAt || '-'}</Descriptions.Item>
                      <Descriptions.Item label="更新时间">{selectedOrganization.updatedAt || '-'}</Descriptions.Item>
                    </Descriptions>
                    <OrganizationMemberQuickAdd organizationId={selectedOrganization?.id} />
                  </>
                )
              : (
                  <Empty description="请从左侧选择一个组织" />
                )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
