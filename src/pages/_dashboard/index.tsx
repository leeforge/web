import { createFileRoute } from '@tanstack/react-router';
import { Button, Flex, Typography } from 'antd';
import CustomIcon from '@/components/CustomIcon/CustomIcon';

const { Title } = Typography;

export const Route = createFileRoute('/_dashboard/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full  flex flex-col items-center justify-center p-8 bg-bgPrimary">
      <div className="mb-8 text-center">
        <Title className="text-textBaseColor" level={3}>
          CMS 管理系统
        </Title>
        <div className="mt-2 text-textBaseColor text-sm">
          主题配置已全局可用，点击右上角设置图标进行配置
        </div>
      </div>

      <Flex
        gap="small"
        wrap
        align="center"
        justify="center"
        className="max-w-4xl"
      >
        <Button type="primary">antd组件-primary</Button>
        <CustomIcon icon="line-md:github" width={46} />
        <Button type="dashed">虚线按钮</Button>
        <Button danger>危险按钮</Button>
      </Flex>

      <div className="mt-8 text-center">
        <div className="text-textBaseColor text-sm mb-4">
          尝试切换主题色和暗色模式，观察组件样式变化
        </div>
        <Flex gap="small" wrap justify="center">
          <div className="bg-primary-9 px-4 py-2 rounded text-textBaseColor">
            主色
          </div>
          <div className="bg-success-9 px-4 py-2 rounded text-textBaseColor">
            成功色
          </div>
          <div className="bg-warning-9 px-4 py-2 rounded text-textBaseColor">
            警告色
          </div>
          <div className="bg-error-9 px-4 py-2 rounded text-textBaseColor">
            错误色
          </div>
          <div className="bg-info-9 px-4 py-2 rounded text-textBaseColor">
            信息色
          </div>
        </Flex>
      </div>
    </div>
  );
}
