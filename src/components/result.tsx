import React, { useEffect, useMemo, useState } from "react";
import type { UploadFile } from "./uploader";
import { parser } from "@/utils/parser";
import { marked } from "marked";
import DOMPurify from "dompurify";

// 配置 marked：支持 GFM、换行、HTML（如 <table>）
marked.setOptions({
  gfm: true,
  breaks: true,
  // 注意：若内容不可信，请结合 DOMPurify 使用
});

// 裁剪图片工具函数
const cropImage = (
  base64: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // 边界保护：防止 canvas 尺寸为 0 或负数
      if (width <= 0 || height <= 0) {
        return reject(new Error("Invalid crop dimensions"));
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      // 裁剪原图指定区域
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      const cropped = canvas.toDataURL("image/png");
      resolve(cropped);
    };
    img.onerror = reject;
    img.src = base64;
  });
};

// 裁剪图组件
const CroppedImage: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: React.CSSProperties;
}> = ({ src, x, y, width, height, style }) => {
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    cropImage(src, x, y, width, height)
      .then(setCroppedSrc)
      .catch((err) => {
        console.error("Image cropping failed:", err);
        setError(true);
      });
  }, [src, x, y, width, height]);

  if (error) {
    return (
      <div
        style={{
          ...style,
          backgroundColor: "#ffe6e6",
          color: "red",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ❌
      </div>
    );
  }

  if (!croppedSrc) {
    return (
      <div
        style={{
          ...style,
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ...
      </div>
    );
  }

  return <img src={croppedSrc} alt="Cropped region" style={style} />;
};

// 主组件
const OCRResult: React.FC<{ source: UploadFile; response?: string }> = ({
  source,
  response,
}) => {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // 获取原图真实尺寸（用于坐标反归一化）
  useEffect(() => {
    if (!source.base64) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      console.error("Failed to load source image for size measurement");
      setImageSize({ width: 0, height: 0 });
    };
    img.src = source.base64;
  }, [source.base64]);

  const results = useMemo(() => {
    if (!response) return [];
    return parser(response);
  }, [response]);

  // 等待 OCR 结果和图像尺寸
  if (!response || !imageSize || imageSize.width === 0) {
    return <div>Loading OCR result...</div>;
  }

  console.log(results);

  const { width: origW, height: origH } = imageSize;

  // 将 [0, 999] 归一化坐标映射到原图像素坐标
  const denormalizeCoord = (norm: number, maxDim: number): number => {
    return Math.round((norm / 999) * maxDim);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <img
        src={source.base64}
        alt="Original (hidden)"
        style={{
          visibility: "hidden",
          maxWidth: "100%",
          height: "auto",
        }}
      />

      {results.map((item, index) => {
        const [[x1, y1, x2, y2]] = item.coords;

        // 反归一化到原图像素
        const px1 = denormalizeCoord(x1, origW);
        const py1 = denormalizeCoord(y1, origH);
        const px2 = denormalizeCoord(x2, origW);
        const py2 = denormalizeCoord(y2, origH);

        // 安全边界处理
        const safeX = Math.max(0, Math.min(px1, origW));
        const safeY = Math.max(0, Math.min(py1, origH));
        const safeWidth = Math.max(0, Math.min(px2 - px1, origW - safeX));
        const safeHeight = Math.max(0, Math.min(py2 - py1, origH - safeY));

        if (item.type === "image") {
          return (
            <CroppedImage
              key={`img-${index}`}
              src={source.base64}
              x={safeX}
              y={safeY}
              width={safeWidth}
              height={safeHeight}
              style={{
                position: "absolute",
                left: `${safeX}px`,
                top: `${safeY}px`,
                width: `${safeWidth}px`,
                height: `${safeHeight}px`,
                border: "1px dashed #1890ff",
                boxSizing: "border-box",
              }}
            />
          );
        }

        // 渲染文本（Markdown + HTML）
        const htmlContent = DOMPurify.sanitize(marked.parse(item.content.trim()) as string);
        return (
          <div
            key={`text-${index}`}
            style={{
              position: "absolute",
              left: `${safeX}px`,
              top: `${safeY}px`,
              width: `${safeWidth}px`,
              height: `${safeHeight}px`, // 允许内容自然撑高
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.6,
              fontSize: 11,
              pointerEvents: "none",
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      })}
    </div>
  );
};

export default OCRResult;