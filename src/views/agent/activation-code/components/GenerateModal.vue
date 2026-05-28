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
			<a-form-item label="目标课程" name="course_id">
				<a-cascader
					v-model:value="courseCascaderValue"
					:options="courseCascaderOptions"
					:field-names="{ label: 'label', value: 'value', children: 'children' }"
					:show-search="{ filter: cascaderFilter }"
					placeholder="请从分类中选择课程"
					allow-clear
					style="width: 100%"
				/>
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
	import { computed, ref, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { generateActivationCodes } from '@/api/agent';
import { getCourseOptions } from '@/api/course';
import { getCourseCategoryTree } from '@/api/course-category';

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
const categoryTree = ref<any[]>([]);
const courseCascaderValue = ref<(string | number)[]>([]);

const formState = ref({
	course_id: undefined,
	count: 100,
	expireDays: 365,
	remark: '',
});

const rules = {
	course_id: [{ required: true, message: '请选择目标课程', trigger: 'change' }],
	count: [{ required: true, message: '请输入生成数量', trigger: 'blur' }],
	expireDays: [{ required: true, message: '请输入有效期', trigger: 'blur' }],
};

const courseCascaderOptions = computed(() => {
	const coursesByPath = new Map<string, any[]>();
	courseList.value.forEach((course: any) => {
		const category = course.category || '未分类';
		const subCategory = course.sub_category || '未分组';
		const key = `${category}__${subCategory}`;
		if (!coursesByPath.has(key)) coursesByPath.set(key, []);
		coursesByPath.get(key)!.push(course);
	});

	const options = categoryTree.value.map((parent: any) => ({
		label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
		value: `cat:${parent.name}`,
		children: (parent.children || [])
			.map((child: any) => {
				const courses = coursesByPath.get(`${parent.name}__${child.name}`) || [];
				return {
					label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
					value: `sub:${parent.name}:${child.name}`,
					children: courses.map((course) => ({
						label: `${course.name}${course.status === 0 ? '（课程已禁用）' : ''}`,
						value: course.id,
					})),
				};
			})
			.filter((child: any) => child.children.length > 0),
	}));

	const categorizedIds = new Set(
		options.flatMap((parent: any) =>
			(parent.children || []).flatMap((child: any) => (child.children || []).map((course: any) => course.value)),
		),
	);
	const uncategorized = courseList.value.filter((course: any) => !categorizedIds.has(course.id));
	if (uncategorized.length > 0) {
		options.push({
			label: '未分类',
			value: 'cat:uncategorized',
			children: [
				{
					label: '未分组',
					value: 'sub:uncategorized',
					children: uncategorized.map((course: any) => ({
						label: `${course.name}${course.status === 0 ? '（课程已禁用）' : ''}`,
						value: course.id,
					})),
				},
			],
		});
	}
	return options.filter((parent: any) => parent.children.length > 0);
});

const cascaderFilter = (inputValue: string, path: any[]) =>
	path.some((option) => String(option.label || '').toLowerCase().includes(inputValue.toLowerCase()));

const fetchCourses = async () => {
	try {
		const [courseRes, categoryRes] = await Promise.all([
			getCourseOptions({ status: 1 }),
			getCourseCategoryTree(),
		]);
		const res = courseRes;
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
		categoryTree.value = Array.isArray(categoryRes.data) ? categoryRes.data : [];
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

watch(
	() => courseCascaderValue.value,
	(value) => {
		const lastValue = Array.isArray(value) ? value[value.length - 1] : undefined;
		formState.value.course_id = typeof lastValue === 'number' ? lastValue : undefined;
	},
);

watch(
	() => props.open,
	(val) => {
		if (val) {
			formState.value = {
				course_id: undefined,
				count: 100,
				expireDays: 365,
				remark: '',
			};
			courseCascaderValue.value = [];
		}
	}
);

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
	courseCascaderValue.value = [];
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		loading.value = true;

		await generateActivationCodes({
			course_id: formState.value.course_id,
			count: formState.value.count,
		});
		message.success('生成成功');
		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error(error?.message || '生成失败');
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	fetchCourses();
});
</script>
