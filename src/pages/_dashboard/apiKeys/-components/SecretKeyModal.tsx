import { Modal } from '@leeforge/react-ui';
import { Button, Space } from 'antd';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';

interface SecretKeyModalProps {
  open: boolean;
  secretKey: string;
  keyName: string;
  onClose: () => void;
}

/**
 * 密钥显示弹窗
 * 创建或轮换 API Key 后一次性显示完整密钥
 */
export function SecretKeyModal({
  open,
  secretKey,
  keyName,
  onClose,
}: SecretKeyModalProps) {
  const { msgSuccess, msgError } = useMsg();
  // 复制到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      msgSuccess('已复制到剪贴板');
    }
    catch {
      msgError('复制失败，请手动复制');
    }
  };

  return (
    <Modal
      title={(
        <div className="flex items-center gap-2">
          <CustomIcon
            icon="line-md:confirm-circle"
            width={24}
            className="text-green-500"
          />
          <span>API Key 创建成功</span>
        </div>
      )}
      visible={open}
      onClose={onClose}
      footer={(
        <Space>
          <Button
            onClick={handleCopy}
            icon={<CustomIcon icon="line-md:clipboard" width={16} />}
          >
            复制密钥
          </Button>
          <Button type="primary" onClick={onClose}>
            我已保存
          </Button>
        </Space>
      )}
      width={600}
      destroyOnClose
    >
      <div className="py-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <CustomIcon
              icon="line-md:alert"
              width={20}
              className="text-yellow-600 mt-0.5"
            />
            <div>
              <p className="text-sm text-yellow-700 font-medium">
                重要提示：请立即保存此密钥！
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                此密钥仅显示一次，关闭此窗口后将无法再次查看完整密钥。
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-textBaseColor mb-2">
            API Key 名称
          </label>
          <div className="text-textSecondary">{keyName}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textBaseColor mb-2">
            完整密钥
          </label>
          <div className="bg-bgSecondary border border-borderSecondary rounded-lg p-4">
            <code className="text-sm font-mono break-all select-all">
              {secretKey}
            </code>
          </div>
        </div>

        <div className="mt-4 text-sm text-textSecondary">
          <p className="mb-2">使用方式：在 API 请求的 Header 中添加：</p>
          <div className="bg-bgSecondary border border-borderSecondary rounded-lg p-3">
            <code className="text-xs font-mono">
              Authorization: Bearer
              {' '}
              {secretKey?.slice(0, 20)}
              ...
            </code>
          </div>
        </div>
      </div>
    </Modal>
  );
}
