<template>
	<a-modal
		v-model:open="visible"
		:title="`管理版块：${category?.name || ''}`"
		width="800px"
		:footer="null"
		@cancel="handleCancel"
	>
		<div class="item-management">
			<div class="header-actions">
				<a-button type="primary" @click="handleAddItem">
					<template #icon><plus-outlined /></template>
					添加题库
				</a-button>
			</div>

			<a-table :columns="columns" :data-source="itemList" :loading="loading" :pagination="false" row-key="id">
				<template #bodyCell="{ column, record, index }">
					<template v-if="column.key === 'index'">
						{{ index + 1 }}
					</template>
					<template v-else-if="column.key === 'course_name'">
						{{ getCourseName(record.course_id) }}
					</template>
					<template v-else-if="column.key === 'sort'">
						<a-input-number
							v-model:value="record.sort"
							:min="0"
							size="small"
							style="width: 100px"
							@change="handleSortChange"
						/>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-button type="link" danger size="small" @click="handleRemove(record)"> 移除 </a-button>
					</template>
				</template>
			</a-table>
		</div>

		<!-- 添加题库弹窗 -->
		<a-modal
			v-model:open="addItemModalVisible"
			title="添加题库"
			@ok="handleAddItemSubmit"
			@cancel="handleAddItemCancel"
		>
			<a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="选择题库" :rules="[{ required: true, message: '请选择题库' }]">
					<a-select
						v-model:value="addItemForm.course_id"
						placeholder="请选择题库"
						:filter-option="filterCourseOption"
						show-search
					>
						<a-select-option v-for="course in availableCourses" :key="course.id" :value="course.id">
							{{ course.name }}
						</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="排序权重">
					<a-input-number v-model:value="addItemForm.sort" :min="0" style="width: 100%" />
					<div style="color: #999; font-size: 12px; margin-top: 4px">数字越小，排序越靠前</div>
				</a-form-item>
			</a-form>
		</a-modal>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { getCategoryDetail, addItem, removeItem, updateItemSort } from '@/api/recommend';
import { getCourseList } from '@/api/course';

const props = defineProps<{
	open: boolean;
	category: any;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const visible = computed({
	get: () => props.open,
	set: (val) => emit('update:open', val),
});

const loading = ref(false);
const itemList = ref<any[]>([]);
const courseList = ref<any[]>([]);
const addItemModalVisible = ref(false);
const addItemForm = ref({
	course_id: undefined,
	sort: 0,
});

const columns = [
	{
		title: '序号',
		key: 'index',
		width: 80,
	},
	{
		title: '题库名称',
		key: 'course_name',
	},
	{
		title: '排序权重',
		key: 'sort',
		width: 150,
	},
	{
		title: '操作',
		key: 'action',
		width: 100,
	},
];

// 获取可用题库列表（排除已添加的）
const availableCourses = computed(() => {
	const addedCourseIds = itemList.value.map((item) => item.course_id);
	return courseList.value.filter((course) => !addedCourseIds.includes(course.id));
});

const getCourseName = (courseId: number) => {
	const course = courseList.value.find((c) => c.id === courseId);
	return course?.name || `题库ID: ${courseId}`;
};

const filterCourseOption = (input: string, option: any) => {
	return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const fetchItemList = async () => {
	if (!props.category?.id) return;

	loading.value = true;
	try {
		const res = await getCategoryDetail(props.category.id);
		itemList.value = res.data.items || [];
	} catch (error) {
		message.error('获取题库列表失败');
	} finally {
		loading.value = false;
	}
};

const fetchCourseList = async () => {
	try {
		const res = await getCourseList();
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

const handleAddItem = () => {
	addItemForm.value = {
		course_id: undefined,
		sort: itemList.value.length > 0 ? Math.max(...itemList.value.map((i) => i.sort)) + 1 : 0,
	};
	addItemModalVisible.value = true;
};

const handleAddItemSubmit = async () => {
	if (!addItemForm.value.course_id) {
		message.error('请选择题库');
		return;
	}

	try {
		await addItem({
			category_id: props.category.id,
			course_id: addItemForm.value.course_id,
			sort: addItemForm.value.sort || 0,
		});
		message.success('添加成功');
		addItemModalVisible.value = false;
		addItemForm.value = {
			course_id: undefined,
			sort: 0,
		};
		fetchItemList();
		emit('success');
	} catch (error: any) {
		const errorMsg = error?.response?.data?.msg || error?.message || '添加失败';
		message.error(errorMsg);
	}
};

const handleAddItemCancel = () => {
	addItemModalVisible.value = false;
	addItemForm.value = {
		course_id: undefined,
		sort: 0,
	};
};

const handleRemove = async (record: any) => {
	try {
		await removeItem(record.id);
		message.success('移除成功');
		fetchItemList();
		emit('success');
	} catch (error: any) {
		const errorMsg = error?.response?.data?.msg || error?.message || '移除失败';
		message.error(errorMsg);
	}
};

const handleSortChange = async () => {
	// 防抖处理，避免频繁请求
	clearTimeout((window as any).sortTimer);
	(window as any).sortTimer = setTimeout(async () => {
		try {
			const items = itemList.value.map((item) => ({
				id: item.id,
				sort: item.sort || 0,
			}));
			await updateItemSort({ items });
			message.success('排序已更新');
			emit('success');
		} catch (error: any) {
			const errorMsg = error?.response?.data?.msg || error?.message || '更新排序失败';
			message.error(errorMsg);
		}
	}, 1000);
};

const handleCancel = () => {
	visible.value = false;
};

watch(
	() => props.open,
	(newVal) => {
		if (newVal) {
			fetchCourseList();
			fetchItemList();
		}
	}
);
</script>

<style scoped lang="scss">
.item-management {
	.header-actions {
		margin-bottom: 16px;
	}
}
</style>
