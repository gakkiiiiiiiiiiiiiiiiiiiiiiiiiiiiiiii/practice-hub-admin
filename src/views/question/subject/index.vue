<template>
	<div class="subject-management">
		<a-card>
			<template #title>课程管理</template>
			<template #extra>
				<a-button type="primary" @click="handleAdd">
					<template #icon><plus-outlined /></template>
					新增课程
				</a-button>
			</template>

			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				@change="handleTableChange"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'cover'">
						<a-image
							:src="record.cover_img || record.cover"
							:width="60"
							:height="60"
							:preview="false"
							style="object-fit: cover"
						/>
					</template>
					<template v-else-if="column.key === 'vip_free'">
						<a-tag :color="record.is_vip_free === 1 ? 'green' : 'default'">
							{{ record.is_vip_free === 1 ? 'VIP免费' : '付费' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
							<a-popconfirm title="确定要删除这个课程吗？" @confirm="handleDelete(record)">
								<a-button type="link" danger size="small">删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<subject-modal v-model:open="modalVisible" :record="currentRecord" @success="handleRefresh" />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { getSubjectList, deleteSubject } from '@/api/question';
import SubjectModal from './components/SubjectModal.vue';

const loading = ref(false);
const dataSource = ref([]);
const modalVisible = ref(false);
const currentRecord = ref(null);

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const columns = [
	{
		title: '封面图',
		key: 'cover',
		width: 100,
	},
	{
		title: '课程名称',
		dataIndex: 'name',
		key: 'name',
	},
	{
		title: '课程',
		dataIndex: 'subject',
		key: 'subject',
	},
	{
		title: '学校',
		dataIndex: 'school',
		key: 'school',
	},
	{
		title: '专业',
		dataIndex: 'major',
		key: 'major',
	},
	{
		title: '真题年份',
		dataIndex: 'exam_year',
		key: 'exam_year',
	},
	{
		title: '答案年份',
		dataIndex: 'answer_year',
		key: 'answer_year',
	},
	{
		title: '当前价格',
		dataIndex: 'price',
		key: 'price',
		customRender: ({ text }: any) => `¥${text}`,
	},
	{
		title: 'VIP免费',
		key: 'vip_free',
		width: 100,
	},
	{
		title: '排序',
		dataIndex: 'sort',
		key: 'sort',
		width: 80,
	},
	{
		title: '操作',
		key: 'action',
		width: 200,
	},
];

const fetchData = async () => {
	loading.value = true;
	try {
		const res = await getSubjectList();
		// 后端返回的是数组，不是分页对象
		dataSource.value = Array.isArray(res.data) ? res.data : res.data.list || [];
		// 如果没有分页信息，使用数组长度
		if (res.data.total !== undefined) {
			pagination.value.total = res.data.total;
		} else {
			pagination.value.total = dataSource.value.length;
		}
	} catch (error) {
		message.error('获取课程列表失败');
	} finally {
		loading.value = false;
	}
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	fetchData();
};

const handleAdd = () => {
	currentRecord.value = null;
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	modalVisible.value = true;
};

const handleDelete = async (record: any) => {
	try {
		await deleteSubject(record.id);
		message.success('删除成功');
		fetchData();
	} catch (error) {
		message.error('删除失败');
	}
};

const handleRefresh = () => {
	fetchData();
};

onMounted(() => {
	fetchData();
});
</script>

<style scoped lang="scss">
.subject-management {
	// 样式
}
</style>
