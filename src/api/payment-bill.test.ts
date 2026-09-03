import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/request', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}))

import request from '@/utils/request'
import {
	BILL_REQUEST_TIMEOUT,
	downloadPaymentBill,
	fetchPaymentBill,
	getPaymentBillList,
	getPaymentBillPreview,
} from './payment-bill'

describe('payment bill API', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('lists cached bills using date and channel filters', () => {
		getPaymentBillList({ channel: 'wechat', startDate: '2026-08-01', endDate: '2026-08-31', page: 2, pageSize: 20 })
		expect(request.get).toHaveBeenCalledWith('/admin/payment-bills', {
			params: { channel: 'wechat', startDate: '2026-08-01', endDate: '2026-08-31', page: 2, pageSize: 20 },
		})
	})

	it('uses a bounded longer timeout only for the explicit bill fetch', () => {
		fetchPaymentBill({ channel: 'xpay', billDate: '2026-08-31' })
		expect(request.post).toHaveBeenCalledWith(
			'/admin/payment-bills/fetch',
			{ channel: 'xpay', billDate: '2026-08-31' },
			{ timeout: BILL_REQUEST_TIMEOUT },
		)
	})

	it('downloads through the authenticated request client instead of a public URL', () => {
		downloadPaymentBill(18, 'xlsx')
		expect(request.get).toHaveBeenCalledWith('/admin/payment-bills/18/download', {
			params: { format: 'xlsx' },
			responseType: 'blob',
			timeout: BILL_REQUEST_TIMEOUT,
		})
	})

	it('loads a bounded preview page', () => {
		getPaymentBillPreview(18, { page: 3, pageSize: 50 })
		expect(request.get).toHaveBeenCalledWith('/admin/payment-bills/18/preview', { params: { page: 3, pageSize: 50 } })
	})
})
