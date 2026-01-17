<template>
	<a-modal
		:open="open"
		title="购买激活码"
		@cancel="handleCancel"
		@ok="handleSubmit"
		:confirmLoading="loading"
		width="600px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item label="题库套餐" name="courseId">
				<a-select v-model:value="formState.courseId" placeholder="请选择题库" @change="handleCourseChange">
					<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
						{{ course.name }} - ¥{{ course.agent_price ?? course.price ?? 0 }}
					</a-select-option>
				</a-select>
			</a-form-item>
			<a-form-item label="购买数量" name="count">
				<a-input-number v-model:value="formState.count" :min="1" style="width: 100%" placeholder="请输入数量" />
			</a-form-item>
			<a-form-item label="代理商单价">
				<span style="font-size: 16px; color: #ff4d4f">
					¥{{ selectedCourse?.agent_price ?? selectedCourse?.price ?? 0 }}
				</span>
			</a-form-item>
			<a-form-item label="总价">
				<span style="font-size: 18px; color: #ff4d4f; font-weight: bold"> ¥{{ totalPrice }} </span>
			</a-form-item>
			<a-form-item label="账户余额">
				<span style="font-size: 16px; color: #52c41a"> ¥{{ balance }} </span>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { buyActivationCodes } from '@/api/agent';
import { getAgentDashboard } from '@/api/dashboard';
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
const balance = ref(0);

const formState = ref({
	courseId: undefined,
	count: 1,
});

const rules = {
	courseId: [{ required: true, message: '请选择题库套餐', trigger: 'change' }],
	count: [{ required: true, message: '请输入购买数量', trigger: 'blur' }],
};

const selectedCourse = computed(() => {
	return courseList.value.find((c: any) => c.id === formState.value.courseId);
});

const totalPrice = computed(() => {
	if (!selectedCourse.value || !formState.value.count) return 0;
	const unitPrice = selectedCourse.value.agent_price ?? selectedCourse.value.price ?? 0;
	return (unitPrice * formState.value.count).toFixed(2);
});

const fetchCourses = async () => {
	try {
		const res = await getCourseList({ page: 1, pageSize: 1000 });
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

const fetchBalance = async () => {
	try {
		const res = await getAgentDashboard();
		balance.value = res.data.balance;
	} catch (error) {
		console.error('获取余额失败:', error);
	}
};

watch(
	() => props.open,
	(val) => {
		if (val) {
			formState.value = {
				courseId: undefined,
				count: 1,
			};
			fetchBalance();
		}
	}
);

const handleCourseChange = () => {
	// 可以在这里添加其他逻辑
};

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();

		if (Number(totalPrice.value) > balance.value) {
			message.error('账户余额不足，请先充值');
			return;
		}

		loading.value = true;

		await buyActivationCodes(formState.value);
		message.success('购买成功');
		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error('购买失败');
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	fetchCourses();
});
</script>
