<template>
	<section class="pricing-guide" aria-label="云打印价格预估与效果说明">
		<div class="price-summary">
			<div>
				<div class="eyebrow">{{ estimate.isActualOrder ? '当前订单预估' : '预估价格' }}</div>
				<div class="estimate-row">
					<strong>{{ formatYuan(estimate.totalYuan) }}</strong>
					<a-tag :color="estimate.known ? 'blue' : 'orange'">{{ estimate.known ? '静态估算' : '需实时询价' }}</a-tag>
				</div>
				<div class="summary-note">{{ estimate.summary }}</div>
			</div>
			<div class="price-breakdown">
				<div>
					<span>打印</span>
					<b>{{ formatYuan(estimate.printAmountYuan) }}</b>
				</div>
				<div>
					<span>装订</span>
					<b>{{ formatYuan(estimate.bindingAmountYuan) }}</b>
				</div>
				<div>
					<span>封面内容</span>
					<b>{{ formatYuan(estimate.coverAmountYuan) }}</b>
				</div>
			</div>
			<div class="rate-note">
				<div v-if="estimate.unitPriceYuan != null">
					参考单价 {{ formatYuan(estimate.unitPriceYuan) }}/{{ estimate.unitLabel }}，共约 {{ estimate.printedUnits }} {{ estimate.unitLabel }}
				</div>
				<div>{{ estimate.priceNote }}</div>
			</div>
		</div>

		<div class="detail-grid">
			<article class="effect-card">
				<div class="section-title">
					<span>打印效果图</span>
					<a-tag>{{ effect.title }}</a-tag>
				</div>
				<figure class="print-preview" :class="effect.className" :aria-label="`${effect.title}示意效果`">
					<div class="paper-sheet">
						<div class="paper-heading">经济学 · 重点笔记</div>
						<div class="line line-long"></div>
						<div class="line line-medium"></div>
						<div class="highlight-line"></div>
						<div class="line line-long"></div>
						<div class="line line-short"></div>
						<div class="photo-grid">
							<i v-for="index in 6" :key="index"></i>
						</div>
					</div>
					<figcaption>示意图用于比较色彩倾向，不代表最终文件内容与校色结果。</figcaption>
				</figure>
				<p class="effect-description">{{ effect.description }}</p>
			</article>

			<article class="notes-card">
				<div class="section-title">补充说明</div>
				<ul>
					<li><b>{{ paper.title }}：</b>{{ paper.description }}</li>
					<li><b>页数口径：</b>单面 1 张 = 1 面；双面 1 张 = 2 面。多页合一会减少实际打印面数。</li>
					<li><b>尺寸：</b>A4 210×297mm，A3 297×420mm，B5 182×257mm。</li>
					<li><b>胶装：</b>成品会在上、下、右侧各裁切约 2–4mm；封面添加文字或图片参考加收 ¥1/本。</li>
					<li><b>运费：</b>小程序普通地区满 ¥1.90 参考包邮，未满参考 ¥2.80；开放接口结算运费以实时询价为准。</li>
				</ul>
				<a-alert
					type="info"
					show-icon
					message="预估金额仅用于选参数"
					description="实际提交前仍会调用刺猬云印计价与运费接口；后台确认弹窗中的最新报价才是送印依据。"
				/>
			</article>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
	estimateCloudPrintPrice,
	formatYuan,
	type CloudPrintEstimateFile,
	type CloudPrintPricingConfig,
} from './pricing'

const props = withDefaults(defineProps<{
	config: CloudPrintPricingConfig
	files?: CloudPrintEstimateFile[]
}>(), {
	files: () => [],
})

const estimate = computed(() => estimateCloudPrintPrice(props.config, props.files))

const effect = computed(() => {
	if (props.config.color === 1) {
		return {
			title: '黑白激光',
			className: 'effect-mono',
			description: '激光打印，文字边缘清晰，适合长期保存；小程序说明为防水、长期不褪色。',
		}
	}
	if (props.config.color === 2) {
		return {
			title: '经济彩印',
			className: 'effect-economy',
			description: '喷墨打印，适合日常资料；色彩较激光偏淡，不防水，不建议用于 3 年以上长期保存。',
		}
	}
	if (props.config.color === 3) {
		return {
			title: '标准彩印',
			className: 'effect-standard',
			description: '激光彩印，颜色更准确、印刷更清晰，适合重要资料和长期保存。',
		}
	}
	return {
		title: '经济黑白',
		className: 'effect-mono economy-black',
		description: '接口支持该模式，但小程序价格表未单列价格与效果说明，请以实际文件预览和实时询价为准。',
	}
})

const paper = computed(() => {
	if (props.config.paperMedia === 1) {
		return { title: '普通纸 70g', description: '线下打印店常用的经济型纸张，适合普通资料。' }
	}
	if (props.config.paperMedia === 2) {
		return { title: '高端纸 80g', description: '打印更清晰、色彩更准确且不易透字，适合双面和重要资料。' }
	}
	if (props.config.paperMedia === 6) {
		return { title: '护眼纸 80g', description: '米白色纸张，降低长时间阅读时的视觉刺激。' }
	}
	return { title: '85g 高端纸', description: '开放接口可选，但小程序价格表未单列该规格价格。' }
})
</script>

<style scoped>
.pricing-guide {
	display: grid;
	gap: 16px;
	padding: 18px;
	border: 1px solid #e7ebf3;
	border-radius: 14px;
	background: linear-gradient(145deg, #f8faff 0%, #fff 52%, #fff9f3 100%);
}
.price-summary {
	display: grid;
	grid-template-columns: minmax(180px, 0.8fr) minmax(280px, 1.1fr) minmax(250px, 1.2fr);
	gap: 18px;
	align-items: center;
}
.eyebrow { color: #5f6b7a; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; }
.estimate-row { display: flex; gap: 10px; align-items: center; margin-top: 2px; }
.estimate-row strong { color: #1d4ed8; font-size: 27px; line-height: 1.2; }
.summary-note, .rate-note { color: #697386; font-size: 12px; line-height: 1.7; }
.summary-note { margin-top: 3px; }
.price-breakdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.price-breakdown > div { padding: 10px 12px; border: 1px solid #edf0f5; border-radius: 10px; background: rgba(255, 255, 255, 0.88); }
.price-breakdown span, .price-breakdown b { display: block; }
.price-breakdown span { color: #8a94a6; font-size: 11px; }
.price-breakdown b { margin-top: 2px; color: #25324b; font-size: 14px; }
.rate-note { padding-left: 16px; border-left: 2px solid #bfd3ff; }
.detail-grid { display: grid; grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr); gap: 14px; }
.effect-card, .notes-card { padding: 16px; border: 1px solid #edf0f5; border-radius: 12px; background: rgba(255, 255, 255, 0.92); }
.section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #172033; font-weight: 600; }
.print-preview { margin: 0; }
.paper-sheet { width: min(100%, 310px); min-height: 158px; margin: 0 auto; padding: 15px; overflow: hidden; border: 1px solid #d8dde8; border-radius: 4px; background: #fff; box-shadow: 0 10px 24px rgba(31, 45, 72, 0.12); transform: rotate(-0.6deg); }
.paper-heading { margin-bottom: 10px; color: #263449; font-size: 11px; font-weight: 700; text-align: center; }
.line { height: 4px; margin: 5px 0; border-radius: 4px; background: #a9b3c4; opacity: 0.85; }
.line-long { width: 92%; }
.line-medium { width: 76%; }
.line-short { width: 58%; }
.highlight-line { width: 84%; height: 7px; margin: 7px 0; border-radius: 3px; background: #ffe75c; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 12px; }
.photo-grid i { height: 30px; border-radius: 3px; background: linear-gradient(135deg, #f04c6a, #ffb84d); }
.photo-grid i:nth-child(2), .photo-grid i:nth-child(5) { background: linear-gradient(135deg, #59c77b, #f7d64a); }
.photo-grid i:nth-child(3), .photo-grid i:nth-child(6) { background: linear-gradient(135deg, #3f75d6, #62d4d0); }
.effect-economy .paper-sheet { filter: saturate(0.68) contrast(0.94); }
.effect-standard .paper-sheet { filter: saturate(1.08) contrast(1.05); }
.effect-mono .paper-sheet { filter: grayscale(1) contrast(1.08); }
.economy-black .paper-sheet { filter: grayscale(1) contrast(0.9); }
figcaption { margin-top: 9px; color: #98a1b2; font-size: 11px; text-align: center; }
.effect-description { margin: 10px 0 0; color: #596579; font-size: 12px; line-height: 1.7; }
.notes-card ul { margin: 0 0 14px; padding-left: 19px; color: #596579; font-size: 12px; line-height: 1.75; }
.notes-card li + li { margin-top: 4px; }
.notes-card b { color: #27344b; }
@media (max-width: 980px) {
	.price-summary { grid-template-columns: 1fr 1.4fr; }
	.rate-note { grid-column: 1 / -1; padding-left: 0; border-left: 0; }
}
@media (max-width: 720px) {
	.price-summary, .detail-grid { grid-template-columns: 1fr; }
	.price-breakdown { grid-template-columns: repeat(3, 1fr); }
}
</style>
