import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:11434/',

  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
  }
});

export const ocr = async (image:string)=>{
    const requestBody = {
        "model": "deepseek-ocr",
        "prompt": "<|grounding|>Convert the document to layout content.",
        "stream": false,
        "images": [
            image
        ]
    }
    const response = await api.post('/api/generate',requestBody);
    return response.data?.response;
}