import request from '@/utils/request'

export type PaymentBillChannel = 'wechat' | 'xpay'
export type PaymentBillStatus = 'fetching' | 'pending' | 'ready' | 'empty' | 'failed'

export interface PaymentBillSummary {
	[key: string]: string | number | null | undefined
}

export interface PaymentBillRecord {
	id: number
	channel: PaymentBillChannel
	billDate: string
	status: PaymentBillStatus
	rowCount: number | null
	originalSize: number | null
	fetchedAt: string | null
	retryAfter: string | null
	errorMessage: string | null
	summary: PaymentBillSummary | null
	previewSupported: boolean
	notice: string | null
	sha256: string | null
	originalFileName?: string | null
}

export interface PaymentBillListParams {
	channel?: PaymentBillChannel
	startDate?: string
	endDate?: string
	page?: number
	pageSize?: number
}

export interface PaymentBillListResponse {
	list: PaymentBillRecord[]
	total: number
	page: number
	pageSize: number
}

export interface PaymentBillPreviewColumn {
	key: string
	title: string
}

export interface PaymentBillPreviewRow {
	cells: Record<string, string>
	matchedOrders: Array<{
		id: number
		orderNo: string
		matchType: string
	}>
}

export interface PaymentBillPreviewResponse {
	columns: PaymentBillPreviewColumn[]
	rows: PaymentBillPreviewRow[]
	total: number
	page: number
	pageSize: number
	previewSupported: boolean
	notice: string | null
}

const BILL_REQUEST_TIMEOUT = 75_000

export function getPaymentBillList(params: PaymentBillListParams) {
	return request.get('/admin/payment-bills', { params })
}

export function fetchPaymentBill(data: { channel: PaymentBillChannel; billDate: string }) {
	return request.post('/admin/payment-bills/fetch', data, { timeout: BILL_REQUEST_TIMEOUT })
}

export function getPaymentBillPreview(id: number, params?: { page?: number; pageSize?: number }) {
	return request.get(`/admin/payment-bills/${id}/preview`, { params })
}

export function downloadPaymentBill(id: number, format: 'original' | 'xlsx'): Promise<Blob> {
	return request.get(`/admin/payment-bills/${id}/download`, {
		params: { format },
		responseType: 'blob',
		timeout: BILL_REQUEST_TIMEOUT,
	}) as Promise<Blob>
}

export { BILL_REQUEST_TIMEOUT }
