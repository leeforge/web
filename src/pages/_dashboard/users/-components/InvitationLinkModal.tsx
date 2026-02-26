import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import { Modal, useModal } from '@leeforge/react-ui';
import { Button, Input, Space } from 'antd';
import { useImperativeHandle, useState } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks/modules/useMsg';

interface InvitationLinkModalData {
  invitationLink: string;
  expiresAt: string;
}

export interface InvitationLinkModalRef {
  open: (data?: ModalOpenOptions<InvitationLinkModalData>) => void;
  close: () => void;
}

interface InvitationLinkModalProps {
  ref?: Ref<InvitationLinkModalRef>;
}

/**
 * 邀请链接弹窗组件
 */
export function InvitationLinkModal({
  ref,
}: InvitationLinkModalProps) {
  const { msgSuccess, msgError } = useMsg();
  const [copying, setCopying] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationLinkModalData | null>(null);

  const { open, visible, close } = useModal<InvitationLinkModalData>({
    beforeOpen: (opts) => {
      setInvitationData(opts?.data ?? null);
    },
    afterClose: () => {
      setInvitationData(null);
      setCopying(false);
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  // 复制链接
  const handleCopy = async () => {
    const link = invitationData?.invitationLink;
    if (!link) {
      return;
    }

    try {
      setCopying(true);
      await navigator.clipboard.writeText(link);
      msgSuccess('邀请链接已复制到剪贴板');
    }
    catch {
      msgError('复制失败，请手动复制');
    }
    finally {
      setCopying(false);
    }
  };

  // 格式化过期时间
  const formatExpiresAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
    catch {
      return dateString;
    }
  };

  return (
    <Modal
      title="邀请链接已生成"
      visible={visible}
      onClose={close}
      footer={(
        <Button type="primary" onClick={close}>
          确定
        </Button>
      )}
      width={600}
      destroyOnHidden
    >
      <div className="py-4">
        <div className="mb-4">
          <div className="mb-2 text-textBaseColor font-medium">邀请链接：</div>
          <Space.Compact className="w-full">
            <Input value={invitationData?.invitationLink || ''} readOnly className="flex-1" />
            <Button
              type="primary"
              icon={<CustomIcon icon="line-md:clipboard-arrow" width={16} />}
              onClick={handleCopy}
              loading={copying}
            >
              复制
            </Button>
          </Space.Compact>
        </div>

        <div className="mb-4">
          <div className="text-textSecondary text-sm">
            有效期至：
            {formatExpiresAt(invitationData?.expiresAt || '')}
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <CustomIcon
              icon="line-md:alert-circle"
              width={16}
              className="text-blue-600 dark:text-blue-400 mt-0.5"
            />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              请将此链接发送给被邀请用户，用户通过链接完成账号激活。
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
