import request from '@/utils/request'

export function getAdminOrderDetail(orderId: number) {
	return request.get(`/admin/orders/${orderId}`)
}

export function getAdminOrderList(params?: {
	page?: number
	pageSize?: number
	status?: string
	order_type?: string
	content_type?: string
	keyword?: string
}) {
	return request.get('/admin/orders/list', { params })
}

export function syncAdminOrderPayment(orderId: number) {
	return request.post(`/admin/orders/${orderId}/sync-payment`)
}

export function shipAdminOrder(orderId: number, data: {
	tracking_no: string
	shipper_code?: string
	shipper_name?: string
	remark?: string
}) {
	return request.post(`/admin/orders/${orderId}/ship`, data)
}

export function queryAdminOrderLogistics(orderId: number) {
	return request.get(`/admin/orders/${orderId}/logistics`)
}

export function refundAdminOrder(orderId: number, data?: { remark?: string }) {
	return request.post(`/admin/orders/${orderId}/refund`, data || {})
}
