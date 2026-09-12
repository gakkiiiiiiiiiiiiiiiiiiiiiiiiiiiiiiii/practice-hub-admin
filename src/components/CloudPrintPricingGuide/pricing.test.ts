import { describe, expect, it } from 'vitest'
import { estimateCloudPrintPrice } from './pricing'

const defaults = {
	paperSize: 9,
	duplex: 2,
	color: 1,
	paperMedia: 1,
	pagesInOne: 1,
	bindType: 3,
	autoBindByPageCount: true,
	coverMedia: 1,
	coverContentType: 1,
}

describe('cloud print price estimate', () => {
	it('estimates the actual page count, printing and glue binding', () => {
		const result = estimateCloudPrintPrice(
			{ ...defaults, bindType: 1 },
			[{ pageCount: 275, quantity: 1 }],
		)

		expect(result.isActualOrder).toBe(true)
		expect(result.printAmountYuan).toBe(13.75)
		expect(result.bindingAmountYuan).toBe(3)
		expect(result.totalYuan).toBe(16.75)
	})

	it('uses a transparent 100-page example when the order page count is unavailable', () => {
		const result = estimateCloudPrintPrice(defaults)

		expect(result.isActualOrder).toBe(false)
		expect(result.documentPages).toBe(100)
		expect(result.totalYuan).toBe(5.2)
	})

	it('applies pages-in-one and the single-sided sheet price', () => {
		const result = estimateCloudPrintPrice(
			{ ...defaults, duplex: 1, pagesInOne: 2, bindType: 0 },
			[{ pageCount: 101, quantity: 2 }],
		)

		expect(result.printedUnits).toBe(102)
		expect(result.totalYuan).toBe(7.14)
	})

	it('falls back to glue binding after the selected binding page limit', () => {
		const result = estimateCloudPrintPrice(
			defaults,
			[{ pageCount: 161, quantity: 1 }],
		)

		expect(result.bindingAmountYuan).toBe(3)
		expect(result.totalYuan).toBe(11.05)
	})

	it('includes the glue cover content surcharge', () => {
		const result = estimateCloudPrintPrice(
			{ ...defaults, bindType: 1, coverMedia: 2, coverContentType: 2 },
			[{ pageCount: 100, quantity: 2 }],
		)

		expect(result.bindingAmountYuan).toBe(8)
		expect(result.coverAmountYuan).toBe(2)
		expect(result.totalYuan).toBe(20)
	})

	it('does not invent a rate for combinations absent from the mini-program table', () => {
		const result = estimateCloudPrintPrice({ ...defaults, color: 3, paperSize: 13 })

		expect(result.known).toBe(false)
		expect(result.totalYuan).toBeNull()
	})
})
