/**
 * icrawler Python 桥接模块
 * 
 * 通过子进程调用 Python icrawler 库实现图片搜索
 * 支持 Bing 和 Baidu 图片搜索
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/** 搜索引擎类型 */
export type ImageSearchEngine = 'bing' | 'baidu';

/** 单个文件信息 */
export interface ImageFile {
  path: string;
  filename: string;
  size: number;
}

/** 搜索结果 */
export interface ImageSearchResult {
  success: boolean;
  engine: ImageSearchEngine;
  keyword: string;
  requested: number;
  downloaded: number;
  files: ImageFile[];
  temp_dir: string;
  error?: string;
}

/** 搜索选项 */
export interface ImageSearchOptions {
  /** 搜索引擎 */
  engine: ImageSearchEngine;
  /** 搜索关键词 */
  keyword: string;
  /** 最大下载数量（默认 10） */
  maxNum?: number;
  /** Python 可执行文件路径（默认 'python'） */
  pythonPath?: string;
  /** 超时时间（毫秒，默认 60000） */
  timeout?: number;
}

/**
 * 获取 Python 脚本路径
 */
function getPythonScriptPath(): string {
  // 相对于当前文件的路径
  const scriptPath = path.resolve(__dirname, '../../../python/image_search.py');
  
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python script not found: ${scriptPath}`);
  }
  
  return scriptPath;
}

/**
 * 使用 icrawler 搜索图片
 * 
 * @param options 搜索选项
 * @returns 搜索结果
 * 
 * @example
 * ```typescript
 * const result = await searchImagesWithICrawler({
 *   engine: 'bing',
 *   keyword: 'cat',
 *   maxNum: 5
 * });
 * console.log(result.files);
 * ```
 */
export async function searchImagesWithICrawler(
  options: ImageSearchOptions
): Promise<ImageSearchResult> {
  const {
    engine,
    keyword,
    maxNum = 10,
    pythonPath = 'python',
    timeout = 60000
  } = options;

  const scriptPath = getPythonScriptPath();

  return new Promise((resolve, reject) => {
    const args = [scriptPath, engine, keyword, String(maxNum)];
    const python = spawn(pythonPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout | null = null;

    // 设置超时
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error(`icrawler search timeout after ${timeout}ms`));
      }, timeout);
    }

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    python.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      if (code === 0) {
        try {
          const result = JSON.parse(stdout) as ImageSearchResult;
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse icrawler output: ${stdout}`));
        }
      } else {
        // 尝试解析错误输出
        try {
          const errorResult = JSON.parse(stdout) as ImageSearchResult;
          resolve(errorResult);
        } catch {
          reject(new Error(`icrawler process failed (code ${code}): ${stderr || stdout}`));
        }
      }
    });
  });
}

/**
 * 搜索 Bing 图片
 * 
 * @param keyword 搜索关键词
 * @param maxNum 最大下载数量
 * @returns 搜索结果
 */
export async function searchBingImages(
  keyword: string,
  maxNum: number = 10
): Promise<ImageSearchResult> {
  return searchImagesWithICrawler({
    engine: 'bing',
    keyword,
    maxNum
  });
}

/**
 * 搜索百度图片
 * 
 * @param keyword 搜索关键词
 * @param maxNum 最大下载数量
 * @returns 搜索结果
 */
export async function searchBaiduImages(
  keyword: string,
  maxNum: number = 10
): Promise<ImageSearchResult> {
  return searchImagesWithICrawler({
    engine: 'baidu',
    keyword,
    maxNum
  });
}

/**
 * 清理临时目录
 * 
 * @param tempDir 临时目录路径
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      fs.unlinkSync(path.join(tempDir, file));
    }
    fs.rmdirSync(tempDir);
  }
}

/**
 * 读取下载的图片为 Buffer
 * 
 * @param filePath 图片文件路径
 * @returns 图片 Buffer
 */
export function readImageAsBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

/**
 * 读取下载的图片为 Base64
 * 
 * @param filePath 图片文件路径
 * @returns Base64 编码的图片
 */
export function readImageAsBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().slice(1);
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
