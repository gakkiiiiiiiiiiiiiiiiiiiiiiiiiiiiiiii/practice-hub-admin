import { describe, expect, it } from 'vitest'
import { canRefundOrder, getRefundWarning, isPaperShippingOrder } from './order-refund-policy'

describe('paper order refund policy', () => {
	it('allows an unrefunded paper after-sale order to be refunded', () => {
		expect(canRefundOrder({ status: 'after_sale', requiresShipping: true, refunded: false })).toBe(true)
		expect(canRefundOrder({ status: 'after_sale', fulfillmentType: 'paper' })).toBe(true)
	})

	it('keeps non-paper after-sale orders out of the refund action', () => {
		expect(canRefundOrder({ status: 'after_sale', contentType: 'file', refunded: false })).toBe(false)
	})

	it('does not offer duplicate refunds', () => {
		expect(canRefundOrder({ status: 'after_sale', requiresShipping: true, refunded: true })).toBe(false)
		expect(canRefundOrder({ status: 'paid', refunded: true })).toBe(false)
	})

	it('keeps the existing paid-order refund entry', () => {
		expect(canRefundOrder({ status: 'paid', contentType: 'file', refunded: false })).toBe(true)
	})

	it('recognizes paper items in a cart and shows a physical-order warning', () => {
		const order = {
			status: 'after_sale',
			cartItems: [{ contentType: 'file' }, { contentType: 'paper_exam' }],
		}
		expect(isPaperShippingOrder(order)).toBe(true)
		expect(getRefundWarning(order)).toContain('微信支付账户')
		expect(getRefundWarning(order)).toContain('已发货订单')
	})
})
