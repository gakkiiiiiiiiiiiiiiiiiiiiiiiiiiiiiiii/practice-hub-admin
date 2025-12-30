import request from '@/utils/request'

// 后台管理系统认证 API
export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  userInfo: {
    id: number
    username: string
    nickname: string
    avatar?: string
    roles: string[]
    permissions?: string[]
  }
}

// 登录
export function login(data: LoginParams) {
  return request.post<LoginResult>('/auth/admin/login', data)
}

// 获取用户信息
export function getUserInfo() {
  return request.get('/auth/admin/info')
}

// 登出（如果后端有提供）
export function logout() {
  return request.post('/auth/admin/logout')
}

// 小程序用户管理 API
// 获取小程序用户列表（需要根据实际 API 文档调整）
export function getAppUserList(params: any) {
  return request.get('/admin/users', { params })
}

// 获取用户详情（需要根据实际 API 文档调整）
export function getAppUserDetail(id: number) {
  return request.get(`/admin/users/${id}`)
}

// 封号/解封
export function updateUserStatus(id: number, data: { status: number }) {
  return request.put(`/admin/users/${id}/status`, data)
}
