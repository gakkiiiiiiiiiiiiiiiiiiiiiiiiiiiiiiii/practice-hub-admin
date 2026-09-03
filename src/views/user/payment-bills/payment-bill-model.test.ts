import { describe, expect, it } from 'vitest'
import {
	getFetchFeedback,
	getPaymentBillDownloadFileName,
	supportsOrderMatching,
} from './payment-bill-model'

const xpayBill = {
	id: 1,
	channel: 'xpay' as const,
	billDate: '2026-09-02',
	status: 'ready' as const,
	rowCount: 1,
	originalSize: 128,
	fetchedAt: null,
	retryAfter: null,
	errorMessage: null,
	summary: null,
	previewSupported: true,
	notice: null,
	sha256: null,
}

describe('payment bill UI model', () => {
	it('does not offer order matching for Xpay settlement summaries', () => {
		expect(supportsOrderMatching('xpay')).toBe(false)
		expect(supportsOrderMatching('wechat')).toBe(true)
	})

	it('shows a failed fetch as an error rather than success', () => {
		expect(getFetchFeedback({ status: 'failed', errorMessage: '渠道拒绝请求' })).toEqual({
			type: 'error',
			text: '渠道拒绝请求',
		})
	})

	it('uses the backend filename for recognized original files', () => {
		expect(getPaymentBillDownloadFileName({ ...xpayBill, filename: 'xpay-20260902.xlsx' }, 'original')).toBe('xpay-20260902.xlsx')
	})

	it('uses bin rather than incorrectly labelling unknown originals as CSV', () => {
		expect(getPaymentBillDownloadFileName(xpayBill, 'original')).toBe('xpay-bill-2026-09-02.bin')
	})
})
