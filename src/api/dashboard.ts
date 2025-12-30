import request from '@/utils/request'

// 获取系统总览数据（系统管理员）
export function getDashboardStats() {
  return request.get('/admin/stats/overview')
}

// 获取系统管理员分析数据（别名，保持兼容）
export function getDashboardAnalysis() {
  return request.get('/admin/stats/overview')
}

// 获取代理商个人数据
export function getAgentDashboard() {
  return request.get('/admin/stats/agent')
}

