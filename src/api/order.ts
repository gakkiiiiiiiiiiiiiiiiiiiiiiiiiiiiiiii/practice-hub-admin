import request from '@/utils/request'

export function getAdminOrderList(params?: {
	page?: number
	pageSize?: number
	status?: string
	order_type?: string
	keyword?: string
}) {
	return request.get('/admin/orders/list', { params })
}
