<template>
	<div class="course-category-management">
		<a-card>
			<template #title>题库分类管理</template>
			<template #extra>
				<a-button type="primary" @click="handleAdd(null)">
					<template #icon><plus-outlined /></template>
					新增一级分类
				</a-button>
			</template>

			<a-table
				:columns="columns"
				:data-source="tableData"
				:loading="loading"
				row-key="id"
				:pagination="false"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'default'">
							{{ record.status === 1 ? '启用' : '禁用' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button
								v-if="!record.parent_id"
								type="link"
								size="small"
								@click="handleAdd(record)"
							>
								新增子分类
							</a-button>
							<a-button
								v-if="record.parent_id"
								type="link"
								size="small"
								@click="handleBindCourse(record)"
							>
								绑定课程
							</a-button>
							<a-button
								v-if="record.parent_id"
								type="link"
								size="small"
								danger
								@click="handleUnbindCourse(record)"
							>
								移除课程
							</a-button>
							<a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
							<a-popconfirm title="确定要删除这个分类吗？" @confirm="handleDelete(record)">
								<a-button type="link" danger size="small">删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal
			:open="modalVisible"
			:title="currentRecord ? '编辑分类' : '新增分类'"
			@cancel="handleCancel"
			@ok="handleSubmit"
			:confirmLoading="modalLoading"
			width="520px"
		>
			<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="分类名称" name="name">
					<a-input v-model:value="formState.name" placeholder="请输入分类名称" />
				</a-form-item>
				<a-form-item label="所属上级" name="parent_id">
					<a-select
						v-model:value="formState.parent_id"
						allow-clear
						placeholder="不选择则为一级分类"
						:options="parentOptions"
						:disabled="currentRecord !== null"
					/>
					<div v-if="!currentRecord" style="margin-top: 4px; color: #999; font-size: 12px">
						只能选择一级分类作为父级，二级分类不允许新增子分类
					</div>
				</a-form-item>
				<a-form-item label="排序" name="sort">
					<a-input-number v-model:value="formState.sort" :min="0" style="width: 100%" />
				</a-form-item>
				<a-form-item label="状态" name="status">
					<a-radio-group v-model:value="formState.status">
						<a-radio :value="1">启用</a-radio>
						<a-radio :value="0">禁用</a-radio>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-modal>

		<!-- 课程选择弹窗 -->
		<a-modal
			:open="courseSelectVisible"
			:title="courseSelectMode === 'bind' ? '绑定课程' : '移除课程'"
			@cancel="handleCourseSelectCancel"
			@ok="handleCourseSelectSubmit"
			:confirmLoading="courseSelectLoading"
			width="800px"
		>
			<div style="margin-bottom: 16px">
				<a-input-search
					v-model:value="courseSearchKeyword"
					:placeholder="courseSelectMode === 'bind' ? '搜索课程名称、科目、分类' : '搜索已绑定的课程'"
					@search="applyCourseFilterAndPagination"
					@input="applyCourseFilterAndPagination"
				/>
				<div v-if="courseSelectMode === 'unbind'" style="margin-top: 8px; color: #999; font-size: 12px">
					仅显示已绑定到该分类的课程，选择后将从该分类中移除
				</div>
			</div>
			<a-table
				:columns="courseColumns"
				:data-source="courseList"
				:loading="courseListLoading"
				:row-selection="{
					selectedRowKeys: selectedCourseIds,
					onChange: onCourseSelectChange,
					getCheckboxProps: getCheckboxProps,
				}"
				row-key="id"
				:pagination="coursePagination"
				@change="handleCourseTableChange"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'category'">
						<span>{{ record.category || '-' }}</span>
					</template>
					<template v-else-if="column.key === 'sub_category'">
						<span>{{ record.sub_category || '-' }}</span>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag v-if="isCourseBound(record)" color="green">已绑定</a-tag>
					</template>
				</template>
			</a-table>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import {
	getCourseCategoryTree,
	createCourseCategory,
	updateCourseCategory,
	deleteCourseCategory,
} from '@/api/course-category';
import { getCourseList, updateCourse } from '@/api/course';

const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const currentRecord = ref<any>(null);
const categoryTree = ref<any[]>([]);
const formRef = ref();
const courseSelectVisible = ref(false);
const courseSelectLoading = ref(false);
const courseListLoading = ref(false);
const courseList = ref<any[]>([]);
const courseSearchKeyword = ref('');
const selectedCourseIds = ref<number[]>([]);
const currentCategory = ref<{ category: string; sub_category: string } | null>(null);
const courseSelectMode = ref<'bind' | 'unbind'>('bind'); // 'bind' 绑定课程, 'unbind' 移除课程

const courseColumns = [
	{ title: '课程名称', dataIndex: 'name', key: 'name' },
	{ title: '一级分类', key: 'category', width: 120 },
	{ title: '二级分类', key: 'sub_category', width: 120 },
	{ title: '价格', dataIndex: 'price', key: 'price', width: 100 },
	{ title: '状态', key: 'status', width: 100 },
];

const coursePagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const formState = ref({
	name: '',
	parent_id: null as number | null,
	sort: 0,
	status: 1,
});

const rules = {
	name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

const columns = [
	{ title: '分类名称', dataIndex: 'name', key: 'name' },
	{ title: '排序', dataIndex: 'sort', key: 'sort', width: 120 },
	{ title: '状态', key: 'status', width: 120 },
	{ title: '操作', key: 'action', width: 360 },
];

const tableData = computed(() => categoryTree.value);

// 只显示一级分类作为父级选项（二级分类不允许新增子分类）
const parentOptions = computed(() =>
	categoryTree.value
		.filter((item) => !item.parent_id) // 只显示一级分类
		.map((item) => ({ label: item.name, value: item.id })),
);

const fetchCategories = async () => {
	loading.value = true;
	try {
		const res = await getCourseCategoryTree();
		const tree = Array.isArray(res.data) ? res.data : [];
		// 移除二级分类的 children 属性，避免显示展开图标，同时添加父级分类名称
		const processTree = (items: any[], parentName?: string): any[] => {
			return items.map((item) => {
				if (item.parent_id) {
					// 二级分类，移除 children 属性，添加父级分类名称
					const { children, ...rest } = item;
					return {
						...rest,
						parentCategoryName: parentName || '',
					};
				} else {
					// 一级分类，递归处理子分类，传递当前分类名称作为父级名称
					return {
						...item,
						children: item.children ? processTree(item.children, item.name) : [],
					};
				}
			});
		};
		categoryTree.value = processTree(tree);
	} catch (error) {
		message.error('获取分类列表失败');
	} finally {
		loading.value = false;
	}
};

const handleAdd = (record: any | null) => {
	// 如果传入的record是二级分类（有parent_id），则不允许添加子分类
	if (record && record.parent_id !== null && record.parent_id !== undefined) {
		message.warning('二级分类不允许新增子分类');
		return;
	}
	currentRecord.value = null;
	formState.value = {
		name: '',
		parent_id: record?.id ?? null,
		sort: 0,
		status: 1,
	};
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	formState.value = {
		name: record.name || '',
		parent_id: record.parent_id ?? null,
		sort: record.sort ?? 0,
		status: record.status ?? 1,
	};
	modalVisible.value = true;
};

const handleCancel = () => {
	modalVisible.value = false;
	formRef.value?.resetFields();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		modalLoading.value = true;
		if (currentRecord.value) {
			await updateCourseCategory(currentRecord.value.id, formState.value);
			message.success('更新成功');
		} else {
			await createCourseCategory(formState.value);
			message.success('创建成功');
		}
		modalVisible.value = false;
		formRef.value?.resetFields();
		fetchCategories();
	} catch (error: any) {
		if (error?.errorFields) return;
		message.error(error?.message || '提交失败');
	} finally {
		modalLoading.value = false;
	}
};

const handleDelete = async (record: any) => {
	try {
		await deleteCourseCategory(record.id);
		message.success('删除成功');
		fetchCategories();
	} catch (error: any) {
		message.error(error?.message || '删除失败');
	}
};

// 处理绑定课程
const handleBindCourse = (record: any) => {
	// 只有二级分类才能绑定课程
	if (!record.parent_id) {
		message.warning('一级分类不能直接绑定课程，请先创建二级分类');
		return;
	}
	// 使用记录中的父级分类名称（在 processTree 中已添加）
	const parentCategoryName = record.parentCategoryName || '';
	// 保存当前分类信息
	currentCategory.value = {
		category: parentCategoryName,
		sub_category: record.name,
	};
	// 设置为绑定模式
	courseSelectMode.value = 'bind';
	// 重置选择
	selectedCourseIds.value = [];
	courseSearchKeyword.value = '';
	coursePagination.value.current = 1;
	// 打开课程选择弹窗
	courseSelectVisible.value = true;
	// 加载课程列表
	fetchCourseList();
};

// 处理移除课程
const handleUnbindCourse = async (record: any) => {
	// 只有二级分类才能移除课程
	if (!record.parent_id) {
		message.warning('一级分类不能移除课程');
		return;
	}
	// 使用记录中的父级分类名称（在 processTree 中已添加）
	const parentCategoryName = record.parentCategoryName || '';
	// 保存当前分类信息
	currentCategory.value = {
		category: parentCategoryName,
		sub_category: record.name,
	};
	// 设置为移除模式
	courseSelectMode.value = 'unbind';
	// 重置选择
	selectedCourseIds.value = [];
	courseSearchKeyword.value = '';
	coursePagination.value.current = 1;
	// 打开课程选择弹窗
	courseSelectVisible.value = true;
	// 加载已绑定到该分类的课程列表
	fetchBoundCourseList();
};

// 存储所有课程数据（用于前端搜索和分页）
const allCourseList = ref<any[]>([]);

// 获取课程列表
const fetchCourseList = async () => {
	courseListLoading.value = true;
	try {
		const res = await getCourseList();
		// 处理返回数据
		if (res.data && Array.isArray(res.data)) {
			allCourseList.value = res.data;
		} else {
			allCourseList.value = [];
		}
		// 应用搜索和分页
		applyCourseFilterAndPagination();
	} catch (error) {
		message.error('获取课程列表失败');
		allCourseList.value = [];
		courseList.value = [];
		coursePagination.value.total = 0;
	} finally {
		courseListLoading.value = false;
	}
};

// 获取已绑定到当前分类的课程列表
const fetchBoundCourseList = async () => {
	courseListLoading.value = true;
	try {
		const res = await getCourseList();
		// 处理返回数据
		if (res.data && Array.isArray(res.data)) {
			allCourseList.value = res.data;
		} else {
			allCourseList.value = [];
		}
		// 过滤出已绑定到当前分类的课程
		if (currentCategory.value) {
			allCourseList.value = allCourseList.value.filter(
				(course) =>
					course.category === currentCategory.value!.category &&
					course.sub_category === currentCategory.value!.sub_category,
			);
		}
		// 应用搜索和分页
		applyCourseFilterAndPagination();
	} catch (error) {
		message.error('获取课程列表失败');
		allCourseList.value = [];
		courseList.value = [];
		coursePagination.value.total = 0;
	} finally {
		courseListLoading.value = false;
	}
};

// 应用搜索和分页
const applyCourseFilterAndPagination = () => {
	let filtered = [...allCourseList.value];
	
	// 搜索过滤
	if (courseSearchKeyword.value) {
		const keyword = courseSearchKeyword.value.toLowerCase();
		filtered = filtered.filter(
			(course) =>
				course.name?.toLowerCase().includes(keyword) ||
				course.subject?.toLowerCase().includes(keyword) ||
				course.category?.toLowerCase().includes(keyword) ||
				course.sub_category?.toLowerCase().includes(keyword),
		);
	}
	
	// 更新总数
	coursePagination.value.total = filtered.length;
	
	// 分页
	const start = (coursePagination.value.current - 1) * coursePagination.value.pageSize;
	const end = start + coursePagination.value.pageSize;
	courseList.value = filtered.slice(start, end);
};

// 判断课程是否已绑定到当前分类
const isCourseBound = (course: any): boolean => {
	if (!currentCategory.value) {
		return false;
	}
	return (
		course.category === currentCategory.value.category &&
		course.sub_category === currentCategory.value.sub_category
	);
};

// 获取复选框属性（用于禁用已绑定的课程）
const getCheckboxProps = (record: any) => {
	// 在绑定模式下，如果课程已经绑定到当前分类，则禁用
	if (courseSelectMode.value === 'bind' && isCourseBound(record)) {
		return {
			disabled: true,
		};
	}
	return {};
};

// 课程选择变化
const onCourseSelectChange = (selectedKeys: number[]) => {
	selectedCourseIds.value = selectedKeys;
};

// 课程表格变化（分页）
const handleCourseTableChange = (pag: any) => {
	coursePagination.value.current = pag.current;
	coursePagination.value.pageSize = pag.pageSize;
	applyCourseFilterAndPagination();
};

// 取消课程选择
const handleCourseSelectCancel = () => {
	courseSelectVisible.value = false;
	selectedCourseIds.value = [];
	courseSearchKeyword.value = '';
	currentCategory.value = null;
	courseSelectMode.value = 'bind';
};

// 提交课程选择
const handleCourseSelectSubmit = async () => {
	if (selectedCourseIds.value.length === 0) {
		message.warning(`请至少选择一个课程`);
		return;
	}
	if (!currentCategory.value) {
		message.error('分类信息丢失，请重试');
		return;
	}
	courseSelectLoading.value = true;
	try {
		if (courseSelectMode.value === 'bind') {
			// 绑定模式：批量更新选中课程的分类
			const updatePromises = selectedCourseIds.value.map((courseId) =>
				updateCourse(courseId, {
					category: currentCategory.value!.category,
					sub_category: currentCategory.value!.sub_category,
				}),
			);
			await Promise.all(updatePromises);
			message.success(`成功将 ${selectedCourseIds.value.length} 个课程绑定到该分类`);
		} else {
			// 移除模式：清空选中课程的分类
			const updatePromises = selectedCourseIds.value.map((courseId) =>
				updateCourse(courseId, {
					category: null,
					sub_category: null,
				}),
			);
			await Promise.all(updatePromises);
			message.success(`成功移除 ${selectedCourseIds.value.length} 个课程的分类绑定`);
		}
		courseSelectVisible.value = false;
		selectedCourseIds.value = [];
		courseSearchKeyword.value = '';
		currentCategory.value = null;
	} catch (error: any) {
		message.error(error?.message || '操作失败');
	} finally {
		courseSelectLoading.value = false;
	}
};

onMounted(() => {
	fetchCategories();
});
</script>
