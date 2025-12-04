import React from "react";
import { ocr } from "@/api";
import "./App.scss";
import Uploader, { type UploadFile } from "@/components/uploader";
import OCRResult from "./components/result";

const App: React.FC = () => {
  const [file, setFile] = React.useState<UploadFile | null>(null);
  const [result, setResult] = React.useState<string>("");

  const handlerOCR = async (uploadFile: UploadFile) => {
    setFile(uploadFile);
    const base64 = uploadFile.base64.split(",")[1];
    const ocrResult = await ocr(base64);
    setResult(ocrResult);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>DeepSeek-OCR</h1>
        <Uploader
          onFinish={handlerOCR}
          text="Upload Picture"
          onClick={() => {
            setFile(null);
            setResult("");
          }}
        />
      </div>
      <div className="container">
        <div className="source-container">
          <h4>Source Content</h4>
          {file && (
            <img src={file.base64} alt={file.name || "Uploaded source"} />
          )}
        </div>
        <div className="result-container">
          <h4>Parser Result</h4>
          {file && (
            <OCRResult source={file} response={result} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
