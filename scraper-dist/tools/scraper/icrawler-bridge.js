"use strict";
/**
 * icrawler Python 桥接模块
 *
 * 通过子进程调用 Python icrawler 库实现图片搜索
 * 支持 Bing 和 Baidu 图片搜索
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchImagesWithICrawler = searchImagesWithICrawler;
exports.searchBingImages = searchBingImages;
exports.searchBaiduImages = searchBaiduImages;
exports.cleanupTempDir = cleanupTempDir;
exports.readImageAsBuffer = readImageAsBuffer;
exports.readImageAsBase64 = readImageAsBase64;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * 获取 Python 脚本路径
 */
function getPythonScriptPath() {
    // 相对于当前文件的路径
    const scriptPath = path_1.default.resolve(__dirname, '../../../python/image_search.py');
    if (!fs_1.default.existsSync(scriptPath)) {
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
async function searchImagesWithICrawler(options) {
    const { engine, keyword, maxNum = 10, pythonPath = 'python', timeout = 60000 } = options;
    const scriptPath = getPythonScriptPath();
    return new Promise((resolve, reject) => {
        const args = [scriptPath, engine, keyword, String(maxNum)];
        const python = (0, child_process_1.spawn)(pythonPath, args, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        let timeoutId = null;
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
            if (timeoutId)
                clearTimeout(timeoutId);
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });
        python.on('close', (code) => {
            if (timeoutId)
                clearTimeout(timeoutId);
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                }
                catch (parseError) {
                    reject(new Error(`Failed to parse icrawler output: ${stdout}`));
                }
            }
            else {
                // 尝试解析错误输出
                try {
                    const errorResult = JSON.parse(stdout);
                    resolve(errorResult);
                }
                catch {
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
async function searchBingImages(keyword, maxNum = 10) {
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
async function searchBaiduImages(keyword, maxNum = 10) {
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
async function cleanupTempDir(tempDir) {
    if (fs_1.default.existsSync(tempDir)) {
        const files = fs_1.default.readdirSync(tempDir);
        for (const file of files) {
            fs_1.default.unlinkSync(path_1.default.join(tempDir, file));
        }
        fs_1.default.rmdirSync(tempDir);
    }
}
/**
 * 读取下载的图片为 Buffer
 *
 * @param filePath 图片文件路径
 * @returns 图片 Buffer
 */
function readImageAsBuffer(filePath) {
    return fs_1.default.readFileSync(filePath);
}
/**
 * 读取下载的图片为 Base64
 *
 * @param filePath 图片文件路径
 * @returns Base64 编码的图片
 */
function readImageAsBase64(filePath) {
    const buffer = fs_1.default.readFileSync(filePath);
    const ext = path_1.default.extname(filePath).toLowerCase().slice(1);
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
//# sourceMappingURL=icrawler-bridge.js.map