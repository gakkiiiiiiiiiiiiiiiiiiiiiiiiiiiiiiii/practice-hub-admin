import request from '@/utils/request'

export function getAdminCouponList(params: {
  page?: number
  pageSize?: number
  keyword?: string
  user_id?: number
  status?: 'unused' | 'used' | 'expired'
  source?: string
}) {
  return request.get('/admin/coupons', { params })
}

export function issueCouponToUser(data: {
  user_id: number
  amount: number
  min_amount?: number
  count?: number
  valid_days?: number | null
}) {
  return request.post('/admin/coupons/issue', data)
}
