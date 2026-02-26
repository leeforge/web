import type { UploadFile, UploadProps } from 'antd';
import type { UploadMediaInput } from '@/api/endpoints/media.api';
import { Empty, Input, Modal, Space, Upload, message } from 'antd';
import { useMemo, useState } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import {
  createUploadDrafts,
  setUploadDraftName,
  toUploadMediaInput,
} from './media-upload-drafts';

const { Dragger } = Upload;

export interface MediaUploadModalProps {
  open: boolean;
  currentPath: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (input: UploadMediaInput) => Promise<void>;
}

export function MediaUploadModal({
  open,
  currentPath,
  confirmLoading = false,
  onCancel,
  onSubmit,
}: MediaUploadModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});

  const drafts = useMemo(() => {
    const files = fileList
      .map(file => file.originFileObj)
      .filter(Boolean) as File[];
    const baseDrafts = createUploadDrafts(files);
    return baseDrafts.map((draft) => {
      const withName = draftNames[draft.key];
      if (withName !== undefined) {
        return setUploadDraftName([draft], draft.key, withName)[0];
      }
      return draft;
    });
  }, [draftNames, fileList]);

  const resetState = () => {
    setFileList([]);
    setDraftNames({});
  };

  const handleClose = () => {
    resetState();
    onCancel();
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);
  };

  const handleSubmit = async () => {
    if (drafts.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }
    for (const draft of drafts) {
      await onSubmit(toUploadMediaInput(draft, currentPath));
    }
    message.success(`已上传 ${drafts.length} 个文件`);
    resetState();
    onCancel();
  };

  return (
    <Modal
      title="上传文件"
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="开始上传"
      cancelText="取消"
      confirmLoading={confirmLoading}
      width={760}
      destroyOnHidden
    >
      <div className="space-y-4">
        <Dragger
          multiple
          fileList={fileList}
          beforeUpload={() => false}
          onChange={handleChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        >
          <p className="ant-upload-drag-icon">
            <CustomIcon icon="line-md:upload" width={44} className="text-primary" />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持上传前配置文件名</p>
        </Dragger>

        <div className="rounded border border-gray-200 p-3 text-xs text-gray-500">
          当前目录：
          {currentPath}
        </div>

        {drafts.length === 0
          ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="请选择文件后配置文件名"
              />
            )
          : (
              <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
                {drafts.map(draft => (
                  <div key={draft.key} className="rounded border border-gray-200 p-3">
                    <Space direction="vertical" size="small" className="w-full">
                      <div className="text-xs text-gray-500">
                        原文件：
                        {draft.file.name}
                      </div>
                      <Input
                        value={draft.fileName}
                        onChange={event => setDraftNames(prev => ({ ...prev, [draft.key]: event.target.value }))}
                        placeholder="可配置上传文件名（不含扩展名）"
                        addonBefore="文件名"
                      />
                    </Space>
                  </div>
                ))}
              </div>
            )}
      </div>
    </Modal>
  );
}
