// Mock 数据配置
import type { MockMethod } from 'vite-plugin-mock'

// 自动导入所有 mock 文件
const modules = import.meta.glob('./modules/*.ts', { eager: true })

const mockList: MockMethod[] = []

Object.keys(modules).forEach((key) => {
  const mod = modules[key] as any
  if (mod.default && Array.isArray(mod.default)) {
    mockList.push(...mod.default)
  }
})

// 导出所有 mock 配置
export default mockList

// 用于生产环境的 Mock 设置（如果需要）
export function setupProdMockServer() {
  // 生产环境通常不使用 Mock
  console.log('Mock server setup (production mode disabled)')
}

