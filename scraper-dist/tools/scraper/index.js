"use strict";
/**
 * 素材爬虫模块导出
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixkitScraper = exports.BaseScraper = void 0;
// 类型导出
__exportStar(require("./types"), exports);
// 基类导出
var base_1 = require("./base");
Object.defineProperty(exports, "BaseScraper", { enumerable: true, get: function () { return base_1.BaseScraper; } });
// Mixkit 爬虫导出
var mixkit_1 = require("./mixkit");
Object.defineProperty(exports, "MixkitScraper", { enumerable: true, get: function () { return mixkit_1.MixkitScraper; } });
//# sourceMappingURL=index.js.map