export const getOrderTypeLabel = (type?: string, fulfillmentType?: string) => {
	if (fulfillmentType === 'paper') return '纸质资料'
	const labels: Record<string, string> = {
		course: '课程',
		package: '套餐',
		category: '分类合集',
	}
	return labels[type || 'course'] || type || '课程'
}

export const getCartContentsLabel = (itemCount: number, fulfillmentType?: string) => {
	return fulfillmentType === 'paper' ? `含 ${itemCount} 种资料` : `含 ${itemCount} 门课程`
}
