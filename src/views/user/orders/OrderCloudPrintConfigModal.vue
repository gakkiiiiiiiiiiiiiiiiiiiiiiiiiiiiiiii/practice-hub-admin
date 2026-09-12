<template>
	<a-modal
		:open="open"
		:title="`订单打印参数 · ${orderNo || '-'}`"
		width="880px"
		:confirm-loading="saving"
		:ok-button-props="{ disabled: !editable || loading }"
		ok-text="保存订单参数"
		cancel-text="取消"
		@ok="save"
		@cancel="emit('update:open', false)"
	>
		<a-spin :spinning="loading">
			<a-alert
				v-if="!editable"
				type="warning"
				show-icon
				message="当前云打印任务已进入不可修改阶段"
				description="如需变更，请先在刺猬云印后台核对并按现有取消流程处理。"
				class="modal-alert"
			/>
			<a-alert
				v-else
				type="info"
				show-icon
				message="此处只覆盖当前订单"
				description="修改已有任务会作废旧报价；保存后必须重新获取报价并再次确认金额。"
				class="modal-alert"
			/>

			<a-form layout="vertical" :model="form" class="config-grid">
				<a-form-item label="纸张尺寸">
					<a-select v-model:value="form.paperSize" :disabled="!editable">
						<a-select-option :value="9">A4</a-select-option>
						<a-select-option :value="8">A3</a-select-option>
						<a-select-option :value="13">B5</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="单双面">
					<a-select v-model:value="form.duplex" :disabled="!editable">
						<a-select-option :value="1">单面</a-select-option>
						<a-select-option :value="2">双面</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="打印颜色">
					<a-select v-model:value="form.color" :disabled="!editable">
						<a-select-option :value="1">黑白</a-select-option>
						<a-select-option :value="2">经济彩印</a-select-option>
						<a-select-option :value="3">标准彩印</a-select-option>
						<a-select-option :value="4">经济黑白</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="纸张材质">
					<a-select v-model:value="form.paperMedia" :disabled="!editable">
						<a-select-option :value="1">普通纸</a-select-option>
						<a-select-option :value="2">高端纸</a-select-option>
						<a-select-option :value="4">85g 高端纸</a-select-option>
						<a-select-option :value="6">80g 护眼纸</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="多页合一">
					<a-select v-model:value="form.pagesInOne" :disabled="!editable">
						<a-select-option v-for="value in [1, 2, 3, 4, 6, 9]" :key="value" :value="value">{{ value }} 页合一</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="装订方式">
					<a-select v-model:value="form.bindType" :disabled="!editable">
						<a-select-option :value="0">不装订 · 无装订费</a-select-option>
						<a-select-option :value="1">胶装 · 8–600 页 · ¥3/本起</a-select-option>
						<a-select-option :value="2">骑马钉 · 8–60 页 · ¥1/本</a-select-option>
						<a-select-option :value="3">订书钉 · 2–160 页 · ¥0.20/本</a-select-option>
						<a-select-option :value="4">圈装 · 8–200 页 · ¥5/本</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="超页自动胶装">
					<a-switch v-model:checked="form.autoBindByPageCount" :disabled="!editable" checked-children="开启" un-checked-children="关闭" />
					<div class="hint">超过所选装订上限时使用下方胶装配置，最多 600 页。</div>
				</a-form-item>
				<template v-if="showGlueOptions">
					<a-form-item label="胶装封面材质">
						<a-select v-model:value="form.coverMedia" :disabled="!editable">
							<a-select-option :value="1">皮纹纸 · 8–600 页 · ¥3/本</a-select-option>
							<a-select-option :value="2">铜版纸 · 8–600 页 · ¥4/本</a-select-option>
						</a-select>
					</a-form-item>
					<a-form-item v-if="form.coverMedia === 1" label="皮纹纸封面颜色">
						<a-select v-model:value="form.coverColor" :disabled="!editable">
							<a-select-option :value="1">绿色</a-select-option>
							<a-select-option :value="2">黄色</a-select-option>
							<a-select-option :value="3">蓝色</a-select-option>
							<a-select-option :value="4">粉色</a-select-option>
							<a-select-option :value="5">白色（默认）</a-select-option>
							<a-select-option :value="6">青蓝色</a-select-option>
						</a-select>
					</a-form-item>
					<a-form-item label="胶装封面内容">
						<a-select v-model:value="form.coverContentType" :disabled="!editable">
							<a-select-option :value="1">纯色封面 · 不加价</a-select-option>
							<a-select-option :value="2">文字封面 · +¥1/本</a-select-option>
							<a-select-option :value="3">空白封面 · 不加价</a-select-option>
							<a-select-option :value="4">文件首页为封面 · +¥1/本</a-select-option>
							<a-select-option :value="5">上传封面图片 · +¥1/本</a-select-option>
							<a-select-option :value="6">上传封面、封底图片 · +¥1/本</a-select-option>
							<a-select-option :value="7">上传封面封底合并图 · +¥1/本</a-select-option>
							<a-select-option :value="8">文件首尾为封面封底 · +¥1/本</a-select-option>
							<a-select-option :value="9">文件首页为封面封底 · +¥1/本</a-select-option>
						</a-select>
					</a-form-item>
					<a-form-item v-if="form.coverContentType === 2" label="封面文字">
						<a-input v-model:value="form.coverContentValue" :disabled="!editable" :maxlength="2000" />
					</a-form-item>
					<a-form-item v-if="[5, 6, 7].includes(form.coverContentType)" label="封面图片 URL">
						<a-input v-model:value="form.coverContentValue" :disabled="!editable" placeholder="公开 HTTPS 图片地址" />
					</a-form-item>
					<a-form-item v-if="form.coverContentType === 6" label="封底图片 URL">
						<a-input v-model:value="form.coverContentValue2" :disabled="!editable" placeholder="公开 HTTPS 图片地址" />
					</a-form-item>
				</template>
				<a-form-item label="打印顺序">
					<a-select v-model:value="form.printCollate" :disabled="!editable">
						<a-select-option :value="0">逐份打印</a-select-option>
						<a-select-option :value="1">逐页打印</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="纸张方向">
					<a-select v-model:value="form.orientation" :disabled="!editable">
						<a-select-option :value="0">自动</a-select-option>
						<a-select-option :value="1">竖版</a-select-option>
						<a-select-option :value="2">横版</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="快递供应商">
					<a-select v-model:value="form.shipSupplierId" :disabled="!editable">
						<a-select-option :value="82">中通</a-select-option>
						<a-select-option :value="120">顺丰标快</a-select-option>
						<a-select-option :value="121">顺丰特快</a-select-option>
					</a-select>
				</a-form-item>
			</a-form>
		</a-spin>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
	getAdminOrderCloudPrintConfig,
	updateAdminOrderCloudPrintConfig,
	type OrderCloudPrintConfig,
} from '@/api/order'

const props = defineProps<{
	open: boolean
	orderId?: number
	orderNo?: string
}>()

const emit = defineEmits<{
	'update:open': [value: boolean]
	saved: [result: any]
}>()

const defaults: OrderCloudPrintConfig = {
	paperSize: 9, duplex: 2, color: 1, paperMedia: 1, pagesInOne: 1,
	bindType: 3, autoBindByPageCount: true, coverMedia: 1, coverColor: 5,
	coverContentType: 1, coverContentValue: '', coverContentValue2: '',
	printCollate: 0, orientation: 0, shipSupplierId: 82,
}
const form = ref<OrderCloudPrintConfig>({ ...defaults })
const loading = ref(false)
const saving = ref(false)
const editable = ref(true)
const showGlueOptions = computed(() => form.value.bindType === 1)

const load = async () => {
	if (!props.orderId) return
	loading.value = true
	try {
		const response = await getAdminOrderCloudPrintConfig(props.orderId)
		form.value = { ...defaults, ...(response.data?.config || {}) }
		editable.value = response.data?.editable !== false
	} catch (error: any) {
		message.error(error?.message || '获取订单打印参数失败')
	} finally {
		loading.value = false
	}
}

const validate = () => {
	if (!showGlueOptions.value) return true
	const type = form.value.coverContentType
	const value = form.value.coverContentValue.trim()
	const value2 = form.value.coverContentValue2.trim()
	if (type === 2 && !value) return message.error('请填写封面文字'), false
	const isHttpsUrl = (input: string) => {
		try { return new URL(input).protocol === 'https:' } catch { return false }
	}
	if ([5, 7].includes(type) && !isHttpsUrl(value)) return message.error('请填写可公开访问的 HTTPS 封面图片 URL'), false
	if (type === 6 && (!isHttpsUrl(value) || !isHttpsUrl(value2))) return message.error('请填写可公开访问的 HTTPS 封面和封底图片 URL'), false
	return true
}

const save = async () => {
	if (!props.orderId || !editable.value || !validate()) return
	saving.value = true
	try {
		const response = await updateAdminOrderCloudPrintConfig(props.orderId, form.value)
		message.success(response.data?.quoteInvalidated ? '参数已保存，旧报价已作废，请重新获取报价' : '订单打印参数已保存')
		emit('saved', response.data)
		emit('update:open', false)
	} catch (error: any) {
		message.error(error?.message || '保存订单打印参数失败')
	} finally {
		saving.value = false
	}
}

watch(() => [props.open, props.orderId], ([open]) => {
	if (open) load()
})
</script>

<style scoped>
.modal-alert { margin-bottom: 20px; }
.config-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.hint { margin-top: 6px; color: rgba(0, 0, 0, 0.45); font-size: 12px; }
@media (max-width: 720px) { .config-grid { grid-template-columns: 1fr; } }
</style>
