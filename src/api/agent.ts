import request from '@/utils/request'

// 获取激活码列表
export function getActivationCodeList(params?: any) {
  return request.get('/admin/codes', { params })
}

// 获取激活码详情
export function getActivationCodeDetail(id: number) {
  return request.get(`/admin/codes/${id}`)
}

// 获取激活码统计
export function getActivationCodeStatistics() {
  return request.get('/admin/codes/statistics')
}

// 生成激活码批次
export function generateActivationCodes(data: any) {
  return request.post('/admin/codes/generate', data)
}

// 删除激活码
export function deleteActivationCode(id: number) {
  return request.delete(`/admin/codes/${id}`)
}

// 购买激活码（代理商）- 如果后端有提供此接口
export function buyActivationCodes(data: any) {
  return request.post('/admin/codes/buy', data)
}

// 导出激活码
export function exportActivationCodes(params?: any) {
  return request.get('/admin/codes/export', {
    params,
    responseType: 'blob',
  })
}

// 获取资金记录（需要根据实际 API 文档调整）
export function getBalanceLog(params?: any) {
  return request.get('/admin/balance-log', { params })
}

