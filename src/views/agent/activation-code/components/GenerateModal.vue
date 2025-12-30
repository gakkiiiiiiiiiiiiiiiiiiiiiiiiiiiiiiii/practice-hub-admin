<template>
	<a-modal
		:open="open"
		title="生成激活码批次"
		@cancel="handleCancel"
		@ok="handleSubmit"
		:confirmLoading="loading"
		width="600px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item label="目标题库" name="courseId">
				<a-select v-model:value="formState.courseId" placeholder="请选择题库">
					<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
						{{ course.name }}
					</a-select-option>
				</a-select>
			</a-form-item>
			<a-form-item label="生成数量" name="count">
				<a-input-number
					v-model:value="formState.count"
					:min="1"
					:max="10000"
					style="width: 100%"
					placeholder="请输入数量"
				/>
			</a-form-item>
			<a-form-item label="有效期" name="expireDays">
				<a-input-number v-model:value="formState.expireDays" :min="1" style="width: 100%" placeholder="请输入天数" />
				<div style="color: #999; margin-top: 4px">激活后有效天数</div>
			</a-form-item>
			<a-form-item label="备注" name="remark">
				<a-textarea v-model:value="formState.remark" :rows="3" placeholder="如：分配给代理商A" />
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { generateActivationCodes } from '@/api/agent';
import { getCourseList } from '@/api/course';

const props = defineProps<{
	open: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const formRef = ref();
const loading = ref(false);
const courseList = ref([]);

const formState = ref({
	courseId: undefined,
	count: 100,
	expireDays: 365,
	remark: '',
});

const rules = {
	courseId: [{ required: true, message: '请选择目标题库', trigger: 'change' }],
	count: [{ required: true, message: '请输入生成数量', trigger: 'blur' }],
	expireDays: [{ required: true, message: '请输入有效期', trigger: 'blur' }],
};

const fetchCourses = async () => {
	try {
		const res = await getCourseList({ page: 1, pageSize: 1000 });
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

watch(
	() => props.open,
	(val) => {
		if (val) {
			formState.value = {
				courseId: undefined,
				count: 100,
				expireDays: 365,
				remark: '',
			};
		}
	}
);

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		loading.value = true;

		await generateActivationCodes(formState.value);
		message.success('生成成功');
		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error('生成失败');
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	fetchCourses();
});
</script>
