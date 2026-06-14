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

export function getRoleDetail(id: number | string) {
  return request.get(`/admin/roles/${id}`)
}

export function getPermissionGroups() {
  return request.get('/admin/roles/permissions')
}

export function createRole(data: { value: string; name: string; description?: string; permissions: string[]; permissionLimits?: Record<string, number | null> }) {
  return request.post('/admin/roles', data)
}

export function updateRole(id: number | string, data: { permissions: string[]; permissionLimits?: Record<string, number | null> }) {
  return request.put(`/admin/roles/${id}/permissions`, data)
}

export function deleteRole(id: number) {
  return request.delete(`/admin/roles/${id}`)
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

// 获取广播消息列表
export function getDailyQuotes() {
  return request.get('/admin/settings/daily-quotes')
}

// 设置广播消息列表
export function setDailyQuotes(data: { quotes: string[] }) {
  return request.put('/admin/settings/daily-quotes', data)
}

// 获取打卡时间配置
export function getCheckinMinutes() {
  return request.get('/admin/settings/checkin-minutes')
}

// 设置打卡时间配置
export function setCheckinMinutes(data: { minutes: number }) {
  return request.put('/admin/settings/checkin-minutes', data)
}

export function getCourseCoverConfig() {
  return request.get('/admin/settings/course-cover')
}

export function setCourseCoverConfig(data: any) {
  return request.put('/admin/settings/course-cover', data)
}

export function getCategoryCoverConfig() {
  return request.get('/admin/settings/category-cover')
}

export function setCategoryCoverConfig(data: any) {
  return request.put('/admin/settings/category-cover', data)
}

export function getCourseIntroTemplate() {
  return request.get('/admin/settings/course-intro-template')
}

export function setCourseIntroTemplate(data: { template: string }) {
  return request.put('/admin/settings/course-intro-template', data)
}

export function getFaqConfig() {
  return request.get('/admin/settings/faqs')
}

export function setFaqConfig(data: { items: Array<{ question: string; answer: string }> }) {
  return request.put('/admin/settings/faqs', data)
}

export function getHomePopupConfig() {
  return request.get('/admin/settings/home-popup')
}

export function setHomePopupConfig(data: {
  enabled?: boolean
  title?: string
  content?: string
  image?: string
  showMode?: 'once' | 'always'
}) {
  return request.put('/admin/settings/home-popup', data)
}

export function getReferralCouponConfig() {
  return request.get('/admin/settings/referral-coupon')
}

export function setReferralCouponConfig(data: {
  enabled?: boolean
  invite_count_per_reward?: number
  coupon_amount?: number
  coupon_min_amount?: number
  max_coupons_per_user?: number
  coupon_valid_days?: number | null
}) {
  return request.put('/admin/settings/referral-coupon', data)
}

export function getPointsConfig() {
  return request.get('/admin/settings/points')
}

export function setPointsConfig(data: {
  enabled?: boolean
  checkin_reward?: number
  exchange_points?: number
  exchange_coupon_amount?: number
  exchange_coupon_min_amount?: number
  coupon_valid_days?: number | null
  exchange_items?: Array<{
    id?: string
    name?: string
    points?: number
    coupon_amount?: number
    coupon_min_amount?: number
    enabled?: boolean
    sort?: number
  }>
}) {
  return request.put('/admin/settings/points', data)
}

export function getUserTitleConfig() {
  return request.get('/admin/settings/user-title')
}

export function setUserTitleConfig(data: {
  enabled?: boolean
  tiers?: Array<{
    id?: string
    name?: string
    minDays?: number
    tierStyle?: string
    textColor?: string
    sort?: number
    enabled?: boolean
  }>
}) {
  return request.put('/admin/settings/user-title', data)
}
