import { describe, expect, it } from 'vitest'
import { getCartContentsLabel, getOrderTypeLabel } from './order-display'

describe('admin order display', () => {
	it('labels paper fulfillment separately from its underlying course order type', () => {
		expect(getOrderTypeLabel('course', 'paper')).toBe('纸质资料')
		expect(getCartContentsLabel(2, 'paper')).toBe('含 2 种资料')
	})

	it('keeps digital order labels unchanged', () => {
		expect(getOrderTypeLabel('course', 'digital')).toBe('课程')
		expect(getOrderTypeLabel('package', 'digital')).toBe('套餐')
		expect(getCartContentsLabel(2, 'digital')).toBe('含 2 门课程')
	})
})
