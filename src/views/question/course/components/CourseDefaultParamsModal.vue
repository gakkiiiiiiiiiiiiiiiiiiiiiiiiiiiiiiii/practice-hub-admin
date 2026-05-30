<template>
	<a-modal
		:open="open"
		title="默认参数管理"
		width="720px"
		:confirm-loading="saving"
		ok-text="保存"
		@cancel="handleCancel"
		@ok="handleSave"
	>
		<a-spin :spinning="loading">
			<div class="form-tip modal-tip">以下参数将作为「新增课程」「批量上传课程」时的初始值。</div>
			<a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
				<a-form-item label="课程类型">
					<a-radio-group v-model:value="formState.content_type">
						<a-radio value="normal">普通题库</a-radio>
						<a-radio value="file">文件课程</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item label="课程">
					<a-input v-model:value="formState.subject" allow-clear placeholder="可选" />
				</a-form-item>
				<a-form-item label="学校">
					<a-input v-model:value="formState.school" allow-clear placeholder="可选" />
				</a-form-item>
				<a-form-item label="专业">
					<a-input v-model:value="formState.major" allow-clear placeholder="可选" />
				</a-form-item>
				<a-form-item label="真题年份">
					<a-input v-model:value="formState.exam_year" allow-clear placeholder="可选" />
				</a-form-item>
				<a-form-item label="答案年份">
					<a-input v-model:value="formState.answer_year" allow-clear placeholder="可选" />
				</a-form-item>
				<a-form-item label="用户售价">
					<a-input-number v-model:value="formState.price" :min="1" :step="1" :precision="0" style="width: 100%" />
				</a-form-item>
				<a-form-item label="代理商售价">
					<a-input-number v-model:value="formState.agent_price" :min="0" :step="1" :precision="0" style="width: 100%" />
					<div class="form-tip">代币支付仅支持整数元。修改默认售价后，仅影响后续新建课程。</div>
				</a-form-item>
				<a-form-item label="是否免费">
					<a-radio-group v-model:value="formState.is_free">
						<a-radio :value="0">付费</a-radio>
						<a-radio :value="1">免费</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item label="有效期(天)">
					<a-input-number
						v-model:value="formState.validity_days"
						:min="1"
						:precision="0"
						:disabled="formState.is_free === 1"
						style="width: 100%"
					/>
				</a-form-item>
				<a-form-item label="源文件查看">
					<a-radio-group v-model:value="formState.allow_source_file">
						<a-radio :value="0">关闭</a-radio>
						<a-radio :value="1">允许</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item label="状态">
					<a-radio-group v-model:value="formState.status">
						<a-radio :value="0">禁用</a-radio>
						<a-radio :value="1">启用</a-radio>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-spin>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { getCourseDefaultParams, setCourseDefaultParams } from '@/api/course';
import {
	FALLBACK_COURSE_DEFAULT_PARAMS,
	normalizeCourseDefaultParams,
	type CourseDefaultParams,
} from '@/utils/course-default-params';

const props = defineProps<{
	open: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'saved', params: CourseDefaultParams): void;
}>();

const loading = ref(false);
const saving = ref(false);
const formState = ref<CourseDefaultParams>({ ...FALLBACK_COURSE_DEFAULT_PARAMS });

const loadDefaults = async () => {
	loading.value = true;
	try {
		const res = await getCourseDefaultParams();
		formState.value = normalizeCourseDefaultParams((res as any)?.data ?? res);
	} catch (error: any) {
		message.error(error?.msg || error?.message || '加载默认参数失败');
		formState.value = { ...FALLBACK_COURSE_DEFAULT_PARAMS };
	} finally {
		loading.value = false;
	}
};

watch(
	() => props.open,
	(value) => {
		if (value) {
			loadDefaults();
		}
	},
);

watch(
	() => formState.value.is_free,
	(value) => {
		if (value === 1) {
			formState.value.validity_days = null;
		} else if (formState.value.validity_days == null) {
			formState.value.validity_days = 365;
		}
	},
);

const handleSave = async () => {
	saving.value = true;
	try {
		const payload = normalizeCourseDefaultParams(formState.value);
		const res = await setCourseDefaultParams(payload);
		const saved = normalizeCourseDefaultParams((res as any)?.data?.params ?? payload);
		formState.value = saved;
		message.success('默认参数已保存');
		emit('saved', saved);
		emit('update:open', false);
	} catch (error: any) {
		message.error(error?.msg || error?.message || '保存失败');
	} finally {
		saving.value = false;
	}
};

const handleCancel = () => {
	emit('update:open', false);
};
</script>

<style scoped>
.modal-tip {
	margin-bottom: 16px;
}

.form-tip {
	color: rgba(0, 0, 0, 0.45);
	font-size: 12px;
	line-height: 1.6;
}
</style>
