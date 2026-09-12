import request from '@/utils/request'

export interface OrderCloudPrintConfig {
	paperSize: number
	duplex: number
	color: number
	paperMedia: number
	pagesInOne: number
	bindType: number
	autoBindByPageCount: boolean
	coverMedia: number
	coverColor: number
	coverContentType: number
	coverContentValue: string
	coverContentValue2: string
	printCollate: number
	orientation: number
	shipSupplierId: number
}

export function getAdminOrderDetail(orderId: number) {
	return request.get(`/admin/orders/${orderId}`)
}

export function getAdminOrderList(params?: {
	page?: number
	pageSize?: number
	status?: string
	order_type?: string
	content_type?: string
	paper_only?: boolean
	cloud_print_status?: string
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

export function submitAdminOrderCloudPrint(orderId: number, expectedTotalAmountCents?: number) {
	return request.post(`/admin/orders/${orderId}/cloud-print`, expectedTotalAmountCents
		? { expectedTotalAmountCents }
		: {})
}

export function getAdminOrderCloudPrint(orderId: number) {
	return request.get(`/admin/orders/${orderId}/cloud-print`)
}

export function getAdminOrderCloudPrintConfig(orderId: number) {
	return request.get(`/admin/orders/${orderId}/cloud-print/config`)
}

export function updateAdminOrderCloudPrintConfig(orderId: number, data: OrderCloudPrintConfig) {
	return request.put(`/admin/orders/${orderId}/cloud-print/config`, data)
}

export function confirmAdminCloudPrintCancelled(orderId: number) {
	return request.post(`/admin/orders/${orderId}/cloud-print/confirm-cancelled`)
}
