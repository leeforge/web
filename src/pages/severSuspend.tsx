import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Result, Space } from 'antd';
import WebsiteJson from '@/assets/lottie-json/emptyBox.json';
// import WebsiteJson from '@/assets/lottie-json/Website.json';
import LottieAnimation from '@/components/LottieAnimation/Suspend';

export const Route = createFileRoute('/severSuspend')({
  component: SeverSuspend,
});

function SeverSuspend() {
  const navigate = useNavigate();
  const handleReturnLogin = () => {
    navigate({ to: '/login' });
  };

  return (
    <>
      <div className="w-100vw h-100vh overflow-hidden overflow-y-auto flex items-center justify-center">
        <Result
          icon={(
            <Space vertical>
              <LottieAnimation
                animationData={WebsiteJson}
                name="'SuspendAnimation'"
                loop={true}
                autoplay={true}
                height={400}
                speed={0.5}
              />
            </Space>
          )}
          title={(
            <>
              <div className="text-18px">服务器维护中</div>
            </>
          )}
          subTitle="预计时间1小时"
          extra={(
            <Button type="primary" onClick={handleReturnLogin}>
              返回登录页
            </Button>
          )}
        />
      </div>
    </>
  );
}
