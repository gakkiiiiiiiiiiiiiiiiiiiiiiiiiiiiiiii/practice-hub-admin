<template>
	<div class="user-list">
		<a-card>
			<template #title>小程序用户</template>
			<template #extra>
				<a-space>
					<a-input-search
						v-model:value="searchForm.keyword"
						placeholder="搜索昵称或OpenID"
						style="width: 250px"
						@search="handleSearch"
						allow-clear
					/>
					<a-select
						v-model:value="searchForm.status"
						placeholder="账号状态"
						style="width: 120px"
						allow-clear
						@change="handleSearch"
					>
						<a-select-option :value="1">正常</a-select-option>
						<a-select-option :value="0">已封禁</a-select-option>
					</a-select>
					<a-button type="primary" @click="handleSearch">查询</a-button>
					<a-button @click="handleReset">重置</a-button>
				</a-space>
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
          <template v-if="column.key === 'avatar'">
            <a-avatar :src="record.avatar" :size="40">
              {{ record.nickname?.[0] || 'U' }}
            </a-avatar>
          </template>
          <template v-else-if="column.key === 'vipStatus'">
            <a-tag :color="record.vipStatus ? 'gold' : 'default'">
              {{ record.vipStatus ? 'VIP' : '普通' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '已封禁' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewDetail(record)">
                查看详情
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 1"
                @click="handleToggleStatus(record)"
              >
                {{ record.status === 1 ? '封号' : '解封' }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <user-detail-modal
      v-model:open="detailModalVisible"
      :user-id="selectedUserId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getAppUserList, updateUserStatus } from '@/api/user';
import UserDetailModal from './components/UserDetailModal.vue';
import dayjs from 'dayjs';

const loading = ref(false);
const dataSource = ref([]);
const detailModalVisible = ref(false);
const selectedUserId = ref<number | null>(null);

const searchForm = ref({
	keyword: '',
	status: undefined as number | undefined,
});

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
	showSizeChanger: true,
	showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
	{
		title: '头像',
		key: 'avatar',
		width: 80,
	},
	{
		title: '昵称',
		dataIndex: 'nickname',
		key: 'nickname',
		width: 120,
	},
	{
		title: 'OpenID',
		dataIndex: 'openId',
		key: 'openId',
		ellipsis: true,
		width: 200,
	},
	{
		title: '手机号',
		dataIndex: 'phone',
		key: 'phone',
		width: 120,
	},
	{
		title: '注册时间',
		dataIndex: 'createdAt',
		key: 'createdAt',
		width: 180,
		customRender: ({ text }: any) => {
			return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
		},
	},
	{
		title: '最后登录',
		dataIndex: 'lastLoginAt',
		key: 'lastLoginAt',
		width: 180,
		customRender: ({ text }: any) => {
			return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
		},
	},
	{
		title: 'VIP状态',
		key: 'vipStatus',
		width: 100,
	},
	{
		title: '账号状态',
		key: 'status',
		width: 100,
	},
	{
		title: '操作',
		key: 'action',
		width: 180,
		fixed: 'right',
	},
];

const fetchData = async () => {
	loading.value = true;
	try {
		const params: any = {
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
		};

		if (searchForm.value.keyword) {
			params.keyword = searchForm.value.keyword;
		}

		if (searchForm.value.status !== undefined) {
			params.status = searchForm.value.status;
		}

		const res = await getAppUserList(params);
		dataSource.value = res.data?.list || [];
		pagination.value.total = res.data?.total || 0;
	} catch (error: any) {
		message.error(error?.message || '获取用户列表失败');
	} finally {
		loading.value = false;
	}
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	fetchData();
};

const handleSearch = () => {
	pagination.value.current = 1;
	fetchData();
};

const handleReset = () => {
	searchForm.value = {
		keyword: '',
		status: undefined,
	};
	pagination.value.current = 1;
	fetchData();
};

const handleViewDetail = (record: any) => {
	selectedUserId.value = record.id;
	detailModalVisible.value = true;
};

const handleToggleStatus = async (record: any) => {
	const newStatus = record.status === 1 ? 0 : 1;
	const action = newStatus === 0 ? '封禁' : '解封';

	Modal.confirm({
		title: '确认操作',
		content: `确定要${action}用户 "${record.nickname}" 吗？`,
		onOk: async () => {
			try {
				await updateUserStatus(record.id, {
					status: newStatus,
				});
				message.success(`${action}成功`);
				fetchData();
			} catch (error: any) {
				message.error(error?.message || `${action}失败`);
			}
		},
	});
};

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.user-list {
  // 样式
}
</style>

