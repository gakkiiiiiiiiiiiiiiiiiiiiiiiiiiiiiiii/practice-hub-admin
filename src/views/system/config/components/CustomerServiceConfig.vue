<template>
	<div class="customer-service-config">
		<a-alert
			type="info"
			show-icon
			message="配置小程序首页客服浮窗、引导文案和客服二维码。修改后同时用于反馈和订单页的客服入口。"
			class="config-tip"
		/>

		<a-form layout="vertical" class="config-form">
			<a-form-item label="启用首页客服浮窗">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>

			<a-row :gutter="16">
				<a-col :span="12">
					<a-form-item label="浮窗文案" required>
						<a-input v-model:value="form.floatingButtonText" :maxlength="8" placeholder="例如：客服" />
					</a-form-item>
				</a-col>
				<a-col :span="12">
					<a-form-item label="弹窗标题" required>
						<a-input v-model:value="form.title" :maxlength="40" placeholder="例如：联系客服" />
					</a-form-item>
				</a-col>
			</a-row>

			<a-form-item label="引导文案" required>
				<a-textarea
					v-model:value="form.guideText"
					:maxlength="300"
					:rows="4"
					show-count
					placeholder="例如：如需帮助，请扫码添加客服QQ"
				/>
			</a-form-item>

			<a-form-item label="客服QQ / 联系方式" required>
				<a-input v-model:value="form.contactValue" :maxlength="64" placeholder="用于展示和一键复制" />
			</a-form-item>

			<a-form-item label="客服二维码" required>
				<a-upload
					v-model:file-list="fileList"
					list-type="picture-card"
					:max-count="1"
					:before-upload="beforeUpload"
					:custom-request="handleUpload"
					:disabled="uploading"
					@remove="handleRemove"
				>
					<div v-if="fileList.length < 1">
						<plus-outlined />
						<div style="margin-top: 8px">上传二维码</div>
					</div>
				</a-upload>
				<div class="field-help">
					{{ isBuiltinQrcode ? '当前使用小程序内置的默认客服二维码。' : '建议上传清晰的正方形或竖版二维码图片。' }}
				</div>
			</a-form-item>

			<a-form-item>
				<a-space>
					<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
					<a-button @click="restoreDefaultQrcode">恢复默认二维码</a-button>
				</a-space>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadFile } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import {
	getCustomerServiceConfig,
	setCustomerServiceConfig,
	type CustomerServiceConfig,
} from '@/api/system'
import { uploadImage } from '@/api/upload'
import { getProxiedImageUrl } from '@/utils/imageProxy'

const DEFAULT_QRCODE = '/customer-service-qq-qr.jpg'
const defaults: CustomerServiceConfig = {
	enabled: true,
	floatingButtonText: '客服',
	title: '联系客服',
	guideText: '如需帮助，请扫码添加客服QQ，我们会尽快为您处理。',
	contactValue: '2705208065',
	qrCodeUrl: DEFAULT_QRCODE,
}

const form = reactive<CustomerServiceConfig>({ ...defaults })
const fileList = ref<UploadFile[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const isBuiltinQrcode = computed(() => form.qrCodeUrl === DEFAULT_QRCODE)

const syncFileList = () => {
	fileList.value = isBuiltinQrcode.value || !form.qrCodeUrl
		? []
		: [{ uid: '-1', name: '客服二维码', status: 'done', url: getProxiedImageUrl(form.qrCodeUrl) }]
}

const load = async () => {
	loading.value = true
	try {
		const res = await getCustomerServiceConfig()
		Object.assign(form, defaults, res.data || res)
		syncFileList()
	} catch {
		message.error('获取客服配置失败')
	} finally {
		loading.value = false
	}
}

const beforeUpload = (file: File) => {
	if (!file.type.startsWith('image/')) {
		message.error('只能上传图片文件')
		return false
	}
	if (file.size / 1024 / 1024 >= 5) {
		message.error('图片大小不能超过 5MB')
		return false
	}
	return true
}

const handleUpload = async ({ file, onSuccess, onError }: any) => {
	uploading.value = true
	try {
		const response = await uploadImage(file as File)
		const imageUrl = response.url || response.imageUrl
		if (!imageUrl) throw new Error('上传失败：未返回图片地址')
		form.qrCodeUrl = imageUrl
		fileList.value = [{ uid: String(Date.now()), name: file.name || '客服二维码', status: 'done', url: getProxiedImageUrl(imageUrl) }]
		onSuccess?.(response, file)
	} catch (error: any) {
		message.error(error?.message || '上传失败')
		onError?.(error)
	} finally {
		uploading.value = false
	}
}

const handleRemove = () => {
	form.qrCodeUrl = DEFAULT_QRCODE
	fileList.value = []
	return true
}

const restoreDefaultQrcode = () => {
	form.qrCodeUrl = DEFAULT_QRCODE
	fileList.value = []
	message.success('已恢复内置默认二维码，请点击保存配置')
}

const save = async () => {
	if (!form.floatingButtonText.trim() || !form.title.trim() || !form.guideText.trim() || !form.contactValue.trim()) {
		message.warning('请完整填写客服文案和联系方式')
		return
	}
	saving.value = true
	try {
		const res = await setCustomerServiceConfig({
			enabled: form.enabled,
			floatingButtonText: form.floatingButtonText.trim(),
			title: form.title.trim(),
			guideText: form.guideText.trim(),
			contactValue: form.contactValue.trim(),
			qrCodeUrl: form.qrCodeUrl || DEFAULT_QRCODE,
		})
		Object.assign(form, defaults, res.data?.config || res.config || form)
		syncFileList()
		message.success('客服配置已保存')
	} catch (error: any) {
		message.error(error?.message || '保存失败')
	} finally {
		saving.value = false
	}
}

onMounted(load)
</script>

<style scoped>
.config-tip {
	margin-bottom: 24px;
}

.config-form {
	max-width: 820px;
}

.field-help {
	margin-top: 8px;
	color: #8c8c8c;
	font-size: 13px;
}
</style>
