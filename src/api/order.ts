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

export function syncAdminOrderPayment(orderId: number) {
	return request.post(`/admin/orders/${orderId}/sync-payment`)
}

export function refundAdminOrder(orderId: number, data?: { remark?: string }) {
	return request.post(`/admin/orders/${orderId}/refund`, data || {})
}
