export type AdminOrderRefundRecord = {
	status?: string
	refunded?: boolean
	requiresShipping?: boolean
	fulfillmentType?: string
	contentType?: string
	cartItems?: Array<{ contentType?: string }>
}

export const isPaperShippingOrder = (record: AdminOrderRefundRecord | null | undefined) => {
	return Boolean(
		record?.requiresShipping ||
		record?.fulfillmentType === 'paper' ||
		record?.contentType === 'paper_exam' ||
		record?.cartItems?.some((item) => item.contentType === 'paper_exam'),
	)
}

export const canRefundOrder = (record: AdminOrderRefundRecord | null | undefined) => {
	if (!record || record.refunded) return false
	if (record.status === 'paid') return true
	return record.status === 'after_sale' && isPaperShippingOrder(record)
}

export const getRefundWarning = (record: AdminOrderRefundRecord | null | undefined) => {
	if (isPaperShippingOrder(record)) {
		return '退款将按订单实付金额原路退回微信支付账户，并关闭该订单。已发货订单请先确认退货处理情况。'
	}
	return '退款将撤销用户课程/套餐权限，并原路退回微信代币或充值金额。'
}
