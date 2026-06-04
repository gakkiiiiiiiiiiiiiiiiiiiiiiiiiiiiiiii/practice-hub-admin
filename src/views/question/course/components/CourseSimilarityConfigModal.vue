<template>
	<a-modal
		:open="open"
		title="同名/类似检测设置"
		width="560px"
		:confirm-loading="saving"
		ok-text="保存"
		@cancel="handleCancel"
		@ok="handleSave"
	>
		<a-spin :spinning="loading">
			<div class="form-tip modal-tip">
				调整「编辑距离」相似度阈值。阈值越高，判定越严格，检出的类似课程越少；阈值越低则相反。
			</div>
			<a-form :label-col="{ span: 7 }" :wrapper-col="{ span: 15 }">
				<a-form-item label="相似度阈值">
					<a-slider
						v-model:value="thresholdPercent"
						:min="50"
						:max="99"
						:tip-formatter="(value) => `${value}%`"
					/>
					<div class="threshold-value">当前：{{ thresholdPercent }}%（{{ formState.threshold }}）</div>
				</a-form-item>
			</a-form>
			<a-alert
				type="info"
				show-icon
				message="说明"
				description="同名、去年份后一致、名称包含关系不受此阈值影响；仅「编辑距离相近」的判定会使用该阈值。"
			/>
		</a-spin>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getCourseSimilarityConfig, setCourseSimilarityConfig } from '@/api/course'
import {
	FALLBACK_COURSE_SIMILARITY_CONFIG,
	normalizeCourseSimilarityConfig,
	type CourseSimilarityConfig,
} from '@/utils/course-similarity-config'

const props = defineProps<{
	open: boolean
}>()

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void
	(e: 'saved', config: CourseSimilarityConfig): void
}>()

const loading = ref(false)
const saving = ref(false)
const formState = ref<CourseSimilarityConfig>({ ...FALLBACK_COURSE_SIMILARITY_CONFIG })

const thresholdPercent = computed({
	get: () => Math.round(formState.value.threshold * 100),
	set: (value: number) => {
		const percent = Math.min(99, Math.max(50, Number(value) || 82))
		formState.value.threshold = percent / 100
	},
})

const loadConfig = async () => {
	loading.value = true
	try {
		const res = await getCourseSimilarityConfig()
		formState.value = normalizeCourseSimilarityConfig((res as { data?: CourseSimilarityConfig })?.data ?? res)
	} catch {
		message.error('获取检测配置失败')
		formState.value = { ...FALLBACK_COURSE_SIMILARITY_CONFIG }
	} finally {
		loading.value = false
	}
}

const handleCancel = () => {
	emit('update:open', false)
}

const handleSave = async () => {
	saving.value = true
	try {
		const payload = normalizeCourseSimilarityConfig(formState.value)
		const res = await setCourseSimilarityConfig(payload)
		const saved = normalizeCourseSimilarityConfig(
			(res as { data?: { config?: CourseSimilarityConfig } })?.data?.config ?? payload,
		)
		formState.value = saved
		message.success('检测配置已保存')
		emit('saved', saved)
		emit('update:open', false)
	} catch {
		message.error('保存失败')
	} finally {
		saving.value = false
	}
}

watch(
	() => props.open,
	(value) => {
		if (value) {
			loadConfig()
		}
	},
)
</script>

<style scoped>
.modal-tip {
	margin-bottom: 16px;
	color: #6b7280;
	font-size: 13px;
}

.threshold-value {
	margin-top: 8px;
	color: #374151;
	font-size: 13px;
}

.form-tip {
	line-height: 1.6;
}
</style>
