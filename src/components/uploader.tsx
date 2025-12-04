import React from "react";
import { Button, Upload } from "antd";
export interface UploadFile {
  name: string;
  base64: string;
}

interface UploaderProps {
  text: string;
  onClick?: () => void;
  onFinish?: (file: UploadFile) => Promise<void>;
}


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const Uploader: React.FC<UploaderProps> = ({ text, onClick, onFinish }) => {
  const [loading, setLoading] = React.useState(false);

  return (
    <Upload
      disabled={loading}
      maxCount={1}
      accept=".png,.jpg,.jpeg"
      showUploadList={false}
      customRequest={async ({ file, onSuccess }) => {
        setLoading(true);
        const base64 = await fileToBase64(file as File);
        await onFinish?.({ name: (file as File).name, base64 });
        onSuccess?.(base64);
        setLoading(false);
      }}
    >
      <Button loading={loading} onClick={onClick} aria-label={text}>
        {text}
      </Button>
    </Upload>
  );
};

export default Uploader;