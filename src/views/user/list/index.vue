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
					<TableColumnSetting :items="settingItems" @update:items="updatePreference" @reset="resetColumns" />
				</a-space>
			</template>

			<a-table
				:columns="displayColumns"
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
          <template v-else-if="column.key === 'packageStatus'">
            <a-tag :color="record.packageStatus ? 'gold' : 'default'">
              {{ record.packageStatus ? '套餐' : '普通' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '已封禁' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'role'">
            <a-tag :color="getAppUserRoleColor(record.role)">
              {{ getAppUserRoleName(record.role) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewDetail(record)">
                查看详情
              </a-button>
              <a-button type="link" size="small" @click="handleIssueCoupon(record)">
                发券
              </a-button>
              <a-button type="link" size="small" danger @click="handleResetAsNew(record)">
                重置为新用户
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 1"
                @click="handleToggleStatus(record)"
              >
                {{ record.status === 1 ? '封号' : '解封' }}
              </a-button>
              <a-button
                v-if="record.role !== 'bank_admin'"
                type="link"
                size="small"
                @click="handleUpdateAppRole(record, 'bank_admin')"
              >
                设为题库管理员
              </a-button>
              <a-button
                v-if="record.role !== 'admin'"
                type="link"
                size="small"
                @click="handleUpdateAppRole(record, 'admin')"
              >
                设为超管
              </a-button>
              <a-button
                v-if="record.role !== 'user'"
                type="link"
                size="small"
                danger
                @click="handleUpdateAppRole(record, 'user')"
              >
                设为普通用户
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

    <issue-coupon-modal
      v-model:open="issueModalVisible"
      :preset-user="issueTargetUser"
      @success="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getAppUserList, updateAppUserRole, updateUserStatus, resetAppUserAsNew } from '@/api/user';
import UserDetailModal from './components/UserDetailModal.vue';
import IssueCouponModal from './components/IssueCouponModal.vue';
import dayjs from 'dayjs';
import TableColumnSetting from '@/components/TableColumnSetting/index.vue';
import { useTableColumns } from '@/composables/useTableColumns';

const loading = ref(false);
const dataSource = ref([]);
const detailModalVisible = ref(false);
const issueModalVisible = ref(false);
const selectedUserId = ref<number | null>(null);
const issueTargetUser = ref<{ id: number; nickname?: string; openId?: string } | null>(null);

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

const baseColumns = [
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
		title: '套餐状态',
		key: 'packageStatus',
		width: 100,
	},
	{
		title: '账号状态',
		key: 'status',
		width: 100,
	},
	{
		title: '小程序角色',
		key: 'role',
		width: 150,
	},
	{
		title: '操作',
		key: 'action',
		width: 520,
		fixed: 'right',
	},
];

const { displayColumns, settingItems, resetColumns, updatePreference } = useTableColumns('user-list', baseColumns, {
	lockRightKeys: ['action'],
});

const appRoleMap: Record<string, { name: string; color: string; description: string }> = {
	user: {
		name: '普通用户',
		color: 'default',
		description: '仅保留普通用户权限。',
	},
	bank_admin: {
		name: '题库管理员',
		color: 'blue',
		description: '可在小程序端上传课程，但不能无限制生成激活码。',
	},
	admin: {
		name: '小程序超级管理员',
		color: 'purple',
		description: '可在小程序端上传课程，并可无限制生成激活码。',
	},
};

const getAppUserRoleName = (role?: string) => appRoleMap[role || 'user']?.name || '普通用户';
const getAppUserRoleColor = (role?: string) => appRoleMap[role || 'user']?.color || 'default';

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

const handleIssueCoupon = (record: any) => {
	issueTargetUser.value = {
		id: record.id,
		nickname: record.nickname,
		openId: record.openId,
	};
	issueModalVisible.value = true;
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

const handleUpdateAppRole = async (record: any, nextRole: 'user' | 'bank_admin' | 'admin') => {
	const roleMeta = appRoleMap[nextRole];
	const action = `设为${roleMeta.name}`;

	Modal.confirm({
		title: '确认操作',
		content: `确定要将 "${record.nickname}" ${action}吗？${roleMeta.description}`,
		onOk: async () => {
			try {
				await updateAppUserRole(record.id, { role: nextRole });
				message.success(`${action}成功`);
				fetchData();
			} catch (error: any) {
				message.error(error?.message || `${action}失败`);
			}
		},
	});
};

const handleResetAsNew = (record: any) => {
	Modal.confirm({
		title: '重置为新用户',
		content: `确定将用户「${record.nickname}」重置为新用户吗？将重置注册时间为当前时间，并清除其被邀请关系、积分流水与打卡记录。课程权限、订单和套餐不受影响。`,
		okText: '确认重置',
		okType: 'danger',
		onOk: async () => {
			try {
				await resetAppUserAsNew(record.id);
				message.success('已重置为新用户');
				fetchData();
			} catch (error: any) {
				message.error(error?.message || '重置失败');
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
