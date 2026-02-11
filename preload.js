const { contextBridge } = require('electron');

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取 scraper 地址
  getScraperUrl: () => 'http://localhost:3100',
  
  // 检查是否在盒子环境中
  isInBox: () => true,
  
  // 获取版本信息
  getVersion: () => ({
    app: require('./package.json').version,
    electron: process.versions.electron,
    node: process.versions.node
  })
});
