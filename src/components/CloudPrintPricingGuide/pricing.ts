export interface CloudPrintPricingConfig {
	paperSize: number
	duplex: number
	color: number
	paperMedia: number
	pagesInOne: number
	bindType: number
	autoBindByPageCount: boolean
	coverMedia: number
	coverContentType: number
}

export interface CloudPrintEstimateFile {
	pageCount: number
	quantity: number
}

interface PrintRate {
	doubleYuanPerFace: number
	singleYuanPerSheet: number
}

export interface CloudPrintPriceEstimate {
	known: boolean
	isActualOrder: boolean
	documentPages: number
	copyCount: number
	printedUnits: number
	unitPriceYuan: number | null
	unitLabel: string
	printAmountYuan: number | null
	bindingAmountYuan: number
	coverAmountYuan: number
	totalYuan: number | null
	summary: string
	priceNote: string
}

const PRINT_RATES: Record<string, PrintRate> = {
	// 刺猬云印小程序价格表：黑白与经济彩印的基础价格相同。
	'base-9-1': { doubleYuanPerFace: 0.05, singleYuanPerSheet: 0.07 },
	'base-9-2': { doubleYuanPerFace: 0.08, singleYuanPerSheet: 0.1 },
	'base-9-6': { doubleYuanPerFace: 0.09, singleYuanPerSheet: 0.1 },
	'base-8-1': { doubleYuanPerFace: 0.1, singleYuanPerSheet: 0.14 },
	'base-8-2': { doubleYuanPerFace: 0.16, singleYuanPerSheet: 0.2 },
	'base-13-1': { doubleYuanPerFace: 0.05, singleYuanPerSheet: 0.07 },
	'standard-9-1': { doubleYuanPerFace: 0.2, singleYuanPerSheet: 0.25 },
	'standard-9-2': { doubleYuanPerFace: 0.25, singleYuanPerSheet: 0.3 },
	'standard-8-1': { doubleYuanPerFace: 0.4, singleYuanPerSheet: 0.5 },
	'standard-8-2': { doubleYuanPerFace: 0.5, singleYuanPerSheet: 0.6 },
}

const BINDING_PRICE: Record<number, number> = {
	0: 0,
	1: 3,
	2: 1,
	3: 0.2,
	4: 5,
}

const BINDING_MAX_PAGES: Record<number, number> = {
	2: 60,
	3: 160,
	4: 200,
}

function normalizeFiles(files: CloudPrintEstimateFile[]) {
	return files
		.map(file => ({
			pageCount: Math.max(0, Math.floor(Number(file.pageCount) || 0)),
			quantity: Math.max(1, Math.floor(Number(file.quantity) || 1)),
		}))
		.filter(file => file.pageCount > 0)
}

function resolveRate(config: CloudPrintPricingConfig) {
	const colorGroup = [1, 2].includes(config.color)
		? 'base'
		: config.color === 3
			? 'standard'
			: 'unlisted'
	return PRINT_RATES[`${colorGroup}-${config.paperSize}-${config.paperMedia}`] || null
}

function resolveBindingType(pageCount: number, config: CloudPrintPricingConfig) {
	const maxPages = BINDING_MAX_PAGES[config.bindType]
	if (config.autoBindByPageCount && maxPages && pageCount > maxPages) return 1
	return config.bindType
}

function bindingPrice(bindingType: number, config: CloudPrintPricingConfig) {
	if (bindingType !== 1) return BINDING_PRICE[bindingType] || 0
	return config.coverMedia === 2 ? 4 : 3
}

function coverPrice(bindingType: number, config: CloudPrintPricingConfig) {
	if (bindingType !== 1) return 0
	return [1, 3].includes(config.coverContentType) ? 0 : 1
}

function roundMoney(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100
}

export function estimateCloudPrintPrice(
	config: CloudPrintPricingConfig,
	files: CloudPrintEstimateFile[] = [],
): CloudPrintPriceEstimate {
	const actualFiles = normalizeFiles(files)
	const estimateFiles = actualFiles.length ? actualFiles : [{ pageCount: 100, quantity: 1 }]
	const rate = resolveRate(config)
	const unitPriceYuan = rate
		? config.duplex === 2
			? rate.doubleYuanPerFace
			: rate.singleYuanPerSheet
		: null
	const pagesInOne = Math.max(1, Math.floor(Number(config.pagesInOne) || 1))

	let documentPages = 0
	let copyCount = 0
	let printedUnits = 0
	let bindingAmountYuan = 0
	let coverAmountYuan = 0
	for (const file of estimateFiles) {
		documentPages += file.pageCount * file.quantity
		copyCount += file.quantity
		printedUnits += Math.ceil(file.pageCount / pagesInOne) * file.quantity
		const effectiveBinding = resolveBindingType(file.pageCount, config)
		bindingAmountYuan += bindingPrice(effectiveBinding, config) * file.quantity
		coverAmountYuan += coverPrice(effectiveBinding, config) * file.quantity
	}

	const printAmountYuan = unitPriceYuan == null ? null : roundMoney(printedUnits * unitPriceYuan)
	const totalYuan = printAmountYuan == null
		? null
		: roundMoney(printAmountYuan + bindingAmountYuan + coverAmountYuan)
	const isActualOrder = actualFiles.length > 0

	return {
		known: unitPriceYuan != null,
		isActualOrder,
		documentPages,
		copyCount,
		printedUnits,
		unitPriceYuan,
		unitLabel: config.duplex === 2 ? '面' : '张',
		printAmountYuan,
		bindingAmountYuan: roundMoney(bindingAmountYuan),
		coverAmountYuan: roundMoney(coverAmountYuan),
		totalYuan,
		summary: isActualOrder
			? `${documentPages} 页 · ${copyCount} 本/份 · 不含运费`
			: `100 页、1 本示例 · 不含运费`,
		priceNote: config.color === 2
			? '经济彩印按文件整体色彩覆盖率计价；这里按覆盖率不超过 10% 的基础价估算。'
			: config.color === 4
				? '小程序价格表未单列经济黑白价格，请以刺猬云实时接口报价为准。'
				: '该结果按小程序公开价格表静态估算，不包含地区运费、活动与经销商结算差异。',
	}
}

export function formatYuan(value: number | null) {
	return value == null ? '待实时报价' : `¥${value.toFixed(2)}`
}
