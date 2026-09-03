import type { PaymentBillChannel, PaymentBillRecord, PaymentBillStatus } from '@/api/payment-bill'

export function supportsOrderMatching(channel: PaymentBillChannel) {
	return channel === 'wechat'
}

export function getFetchFeedback(data: {
	status?: PaymentBillStatus
	notice?: string | null
	errorMessage?: string | null
}) {
	if (data.status === 'failed') return { type: 'error' as const, text: data.errorMessage || data.notice || '账单获取失败' }
	if (data.status === 'pending' || data.status === 'fetching') {
		return { type: 'info' as const, text: data.notice || '账单正在生成，请稍后手动刷新或点击手动查询' }
	}
	if (data.status === 'empty') return { type: 'info' as const, text: data.notice || '该日期暂无账单' }
	return { type: 'success' as const, text: data.notice || '账单已获取并缓存' }
}

export function getPaymentBillDownloadFileName(record: PaymentBillRecord, format: 'original' | 'xlsx') {
	const channel = record.channel === 'wechat' ? 'wechat-payment' : 'xpay'
	if (format === 'original' && record.filename && /^[A-Za-z0-9._-]+$/.test(record.filename)) {
		return record.filename
	}
	if (format === 'xlsx') return `${channel}-bill-${record.billDate}.xlsx`
	const extension = record.contentType === 'text/csv' ? 'csv' : 'bin'
	return `${channel}-bill-${record.billDate}.${extension}`
}
