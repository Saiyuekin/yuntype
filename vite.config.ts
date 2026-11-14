import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// ═══════════════════════════════════════
//  内容安全策略(CSP)— 仅生产构建注入
//
//  - script-src 'self':禁止一切内联/外站脚本 → 即使页面被注入脚本也无法读取密钥
//  - connect-src 白名单:密钥只能发往这 10 家 AI 服务商,'self' 之外的接口一律拦截
//  - style 允许 unsafe-inline:预览 HTML 依赖内联样式(核心功能)
//  - 开发模式不注入:Vite HMR / React 刷新依赖内联脚本,会被 CSP 误杀
// ═══════════════════════════════════════

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https: http:",
  // connect-src 放开为任意 https + 本地回环:产品支持"任意 OpenAI 兼容 API"(sub2api/one-api 中转、本地 LLM 等),
  // 白名单会拦截合法的自定义端点。安全边界由 script-src 'self' 承担:注入脚本无法执行,就读不到密钥。
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function cspMeta(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!--CSP-->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP_DIRECTIVES}">`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), cspMeta()],
  base: '/yuntype/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
