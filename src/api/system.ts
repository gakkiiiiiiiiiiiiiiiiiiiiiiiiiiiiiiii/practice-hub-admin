import request from '@/utils/request'

// 账号管理（需要根据实际 API 文档调整，可能后端未提供）
export function getAccountList(params?: any) {
  return request.get('/admin/accounts', { params })
}

export function createAccount(data: any) {
  return request.post('/admin/accounts', data)
}

export function updateAccount(id: number, data: any) {
  return request.put(`/admin/accounts/${id}`, data)
}

export function deleteAccount(id: number) {
  return request.delete(`/admin/accounts/${id}`)
}

// 角色管理
export function getRoleList(params?: any) {
  return request.get('/admin/roles', { params })
}

export function getRoleDetail(value: string) {
  return request.get(`/admin/roles/${value}`)
}

export function getPermissionGroups() {
  return request.get('/admin/roles/permissions')
}

export function updateRole(value: string, data: { permissions: string[] }) {
  return request.put(`/admin/roles/${value}/permissions`, data)
}

// 运营配置
// 设置考研倒计时
export function setCountdown(data: { targetDate: string }) {
  return request.put('/admin/settings/countdown', data)
}

// 获取操作日志
export function getOperationLogs(params?: any) {
  return request.get('/admin/logs', { params })
}

// 获取系统配置（需要根据实际 API 文档调整）
export function getSystemConfig() {
  return request.get('/admin/settings')
}

// 更新系统配置
export function updateSystemConfig(data: any) {
  return request.put('/admin/settings', data)
}

