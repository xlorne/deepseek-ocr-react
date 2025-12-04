
export interface OCRLayout{
    type:string;
    coords:number[][];
    content:string;
}

export const parser = (response: string):OCRLayout[] => {
    // 正则：匹配所有 ref-detection 对
    const regexp = /<\|ref\|>(.*?)<\|\/ref\|><\|det\|>(\[\[.*?\]\])<\|\/det\|>/g;
    const results: OCRLayout[] = [];
  
    let match;
    let lastIndex = 0;
  
    while ((match = regexp.exec(response)) !== null) {
      const type = match[1]; // e.g., "image" or "text"
      const coordsStr = match[2]; // e.g., "[[81, 49, 999, 401]]"
  
      // 解析坐标（支持多个 bbox，如 [[x1,y1,x2,y2], [x3,y3,x4,y4]]）
      const coords: number[][] = JSON.parse(coordsStr.replace(/'/g, '"'));
  
      // 找到本段 detection 之后紧接着的非标签文本（直到下一个 <|ref|> 或字符串结束）
      const nextRefIndex = response.indexOf('<|ref|>', match.index + match[0].length);
      const endIndex = nextRefIndex === -1 ? response.length : nextRefIndex;
      const content = response
        .substring(match.index + match[0].length, endIndex)
        .replace(/^\\n+|\\n+$/g, '') // 去除开头结尾换行（注意你的字符串里是 \\n 而非 \n）
        .trim();
      results.push({ type, coords, content });
      // 避免无限循环（安全措施）
      if (match.index === regexp.lastIndex) regexp.lastIndex++;
    }
    return results;
  };
