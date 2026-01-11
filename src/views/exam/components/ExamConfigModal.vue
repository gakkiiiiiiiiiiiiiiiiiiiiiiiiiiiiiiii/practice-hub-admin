<template>
	<a-modal
		:open="open"
		:title="record ? '编辑考试配置' : '新增考试配置'"
		@cancel="handleCancel"
		@ok="handleSubmit"
		@update:open="(val) => emit('update:open', val)"
		:confirmLoading="loading"
		width="800px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item v-if="!courseId" label="课程" name="course_id">
				<a-select v-model:value="formState.course_id" placeholder="请选择课程">
					<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
						{{ course.name }}
					</a-select-option>
				</a-select>
			</a-form-item>
			<a-form-item v-else label="课程">
				<a-input :value="props.courseName || ''" disabled />
			</a-form-item>

			<a-form-item label="考试名称" name="name">
				<a-input v-model:value="formState.name" placeholder="请输入考试名称" />
			</a-form-item>

			<a-form-item label="考试时长（分钟）" name="duration">
				<a-input-number v-model:value="formState.duration" :min="1" :max="600" style="width: 200px" />
			</a-form-item>

			<a-divider orientation="left">题目配置</a-divider>

			<a-form-item label="单选题">
				<a-space>
					<span>每题</span>
					<a-input-number
						v-model:value="formState.single_choice_score"
						:min="0"
						:precision="2"
						style="width: 100px"
						addon-after="分"
					/>
					<span>共</span>
					<a-input-number
						v-model:value="formState.single_choice_count"
						:min="0"
						style="width: 100px"
						addon-after="道"
					/>
				</a-space>
			</a-form-item>

			<a-form-item label="多选题">
				<a-space>
					<span>每题</span>
					<a-input-number
						v-model:value="formState.multiple_choice_score"
						:min="0"
						:precision="2"
						style="width: 100px"
						addon-after="分"
					/>
					<span>共</span>
					<a-input-number
						v-model:value="formState.multiple_choice_count"
						:min="0"
						style="width: 100px"
						addon-after="道"
					/>
				</a-space>
			</a-form-item>

			<a-form-item label="判断题">
				<a-space>
					<span>每题</span>
					<a-input-number
						v-model:value="formState.judge_score"
						:min="0"
						:precision="2"
						style="width: 100px"
						addon-after="分"
					/>
					<span>共</span>
					<a-input-number
						v-model:value="formState.judge_count"
						:min="0"
						style="width: 100px"
						addon-after="道"
					/>
				</a-space>
			</a-form-item>

			<a-form-item label="及格分" name="pass_score">
				<a-input-number v-model:value="formState.pass_score" :min="0" :precision="2" style="width: 200px" addon-after="分" />
			</a-form-item>

			<a-form-item label="考试规则" name="rules">
				<a-textarea v-model:value="formState.rules" :rows="3" placeholder="请输入考试规则说明（可选）" />
			</a-form-item>

			<a-form-item label="是否启用" name="is_enabled">
				<a-switch v-model:checked="formState.is_enabled" :checkedValue="1" :unCheckedValue="0" />
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { createExamConfig, updateExamConfig } from '@/api/exam';

const props = defineProps<{
	open: boolean;
	record: any;
	courseList?: any[];
	courseId?: number | null;
	courseName?: string;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const formRef = ref();
const loading = ref(false);

const formState = ref({
	course_id: undefined,
	name: '',
	duration: 60,
	single_choice_score: 1,
	single_choice_count: 0,
	multiple_choice_score: 2,
	multiple_choice_count: 0,
	judge_score: 1,
	judge_count: 0,
	pass_score: 0,
	rules: '',
	is_enabled: 1,
});

const rules = computed(() => {
	const baseRules: any = {
		name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
		duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
		pass_score: [{ required: true, message: '请输入及格分', trigger: 'blur' }],
	};
	
	// 如果没有传入 courseId，则需要验证 course_id
	if (!props.courseId) {
		baseRules.course_id = [{ required: true, message: '请选择课程', trigger: 'change' }];
	}
	
	return baseRules;
});

watch(
	() => props.open,
	(val) => {
		if (val) {
			if (props.record) {
				// 编辑
				formState.value = {
					course_id: props.record.course_id,
					name: props.record.name,
					duration: props.record.duration,
					single_choice_score: props.record.single_choice_score,
					single_choice_count: props.record.single_choice_count,
					multiple_choice_score: props.record.multiple_choice_score,
					multiple_choice_count: props.record.multiple_choice_count,
					judge_score: props.record.judge_score,
					judge_count: props.record.judge_count,
					pass_score: props.record.pass_score,
					rules: props.record.rules || '',
					is_enabled: props.record.is_enabled !== undefined ? props.record.is_enabled : 1,
				};
			} else {
				// 新增
				formState.value = {
					course_id: props.courseId || undefined,
					name: '',
					duration: 60,
					single_choice_score: 1,
					single_choice_count: 0,
					multiple_choice_score: 2,
					multiple_choice_count: 0,
					judge_score: 1,
					judge_count: 0,
					pass_score: 0,
					rules: '',
					is_enabled: 1,
				};
			}
		}
	}
);

watch(
	[
		() => formState.value.single_choice_score,
		() => formState.value.single_choice_count,
		() => formState.value.multiple_choice_score,
		() => formState.value.multiple_choice_count,
		() => formState.value.judge_score,
		() => formState.value.judge_count,
	],
	() => {
		// 自动计算满分（用于显示，不提交）
		const fullScore =
			formState.value.single_choice_count * formState.value.single_choice_score +
			formState.value.multiple_choice_count * formState.value.multiple_choice_score +
			formState.value.judge_count * formState.value.judge_score;
		// 可以在这里显示满分提示
	}
);

const handleCancel = () => {
	formRef.value?.resetFields();
	emit('update:open', false);
};

const handleSubmit = async () => {
	try {
		await formRef.value.validate();
	} catch (error) {
		return;
	}

	// 验证题目数量
	const totalCount =
		formState.value.single_choice_count +
		formState.value.multiple_choice_count +
		formState.value.judge_count;

	if (totalCount === 0) {
		message.warning('至少需要配置一种题型');
		return;
	}

	// 确保 course_id 有值
	if (props.courseId && !formState.value.course_id) {
		formState.value.course_id = props.courseId;
	}

	loading.value = true;
	try {
		if (props.record) {
			await updateExamConfig(props.record.id, formState.value);
			message.success('更新成功');
		} else {
			await createExamConfig(formState.value);
			message.success('创建成功');
		}
		formRef.value?.resetFields();
		emit('success');
	} catch (error: any) {
		message.error(error.msg || error.message || '操作失败');
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped lang="scss">
// 样式
</style>
