<template>
	<div class="coupon-list">
		<a-card>
			<template #title>优惠券管理</template>
			<template #extra>
				<a-button type="primary" @click="openIssueModal">
					<template #icon>
						<PlusOutlined />
					</template>
					发放优惠券
				</a-button>
			</template>

			<a-form :model="searchForm" layout="inline" class="search-form">
				<a-form-item label="用户">
					<a-input-search
						v-model:value="searchForm.keyword"
						placeholder="昵称或 OpenID"
						style="width: 220px"
						allow-clear
						@search="handleSearch"
					/>
				</a-form-item>
				<a-form-item label="状态">
					<a-select v-model:value="searchForm.status" placeholder="全部" style="width: 120px" allow-clear>
						<a-select-option value="unused">未使用</a-select-option>
						<a-select-option value="used">已使用</a-select-option>
						<a-select-option value="expired">已过期</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="来源">
					<a-select v-model:value="searchForm.source" placeholder="全部" style="width: 120px" allow-clear>
						<a-select-option value="admin">后台发放</a-select-option>
						<a-select-option value="referral">拉新奖励</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item>
					<a-button type="primary" @click="handleSearch">查询</a-button>
					<a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
				</a-form-item>
			</a-form>

			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				row-key="id"
				@change="handleTableChange"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'user'">
						<a-space>
							<a-avatar :src="record.user?.avatar" :size="32">
								{{ record.user?.nickname?.[0] || 'U' }}
							</a-avatar>
							<div>
								<div>{{ record.user?.nickname || '未知用户' }}</div>
								<div style="color: #999; font-size: 12px">ID: {{ record.userId }}</div>
							</div>
						</a-space>
					</template>
					<template v-else-if="column.key === 'label'">
						<a-tag color="orange">{{ record.label }}</a-tag>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
					</template>
					<template v-else-if="column.key === 'sourceLabel'">
						<a-tag>{{ record.sourceLabel }}</a-tag>
					</template>
					<template v-else-if="column.key === 'expireTime'">
						{{ formatTime(record.expireTime) }}
					</template>
					<template v-else-if="column.key === 'createTime'">
						{{ formatTime(record.createTime) }}
					</template>
				</template>
			</a-table>
		</a-card>

		<IssueCouponModal v-model:open="issueModalVisible" @success="fetchData" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { getAdminCouponList } from '@/api/coupon'
import IssueCouponModal from '../list/components/IssueCouponModal.vue'

const loading = ref(false)
const dataSource = ref<any[]>([])
const issueModalVisible = ref(false)

const searchForm = ref({
	keyword: '',
	status: undefined as string | undefined,
	source: undefined as string | undefined,
})

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
	showSizeChanger: true,
	showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
	{ title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
	{ title: '用户', key: 'user', width: 180 },
	{ title: '优惠内容', key: 'label', width: 140 },
	{ title: '状态', key: 'status', width: 100 },
	{ title: '来源', key: 'sourceLabel', width: 110 },
	{ title: '过期时间', key: 'expireTime', width: 170 },
	{ title: '发放时间', key: 'createTime', width: 170 },
]

const formatTime = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '永久有效')

const getStatusLabel = (status: string) => {
	const map: Record<string, string> = {
		unused: '未使用',
		used: '已使用',
		expired: '已过期',
	}
	return map[status] || status
}

const getStatusColor = (status: string) => {
	const map: Record<string, string> = {
		unused: 'green',
		used: 'default',
		expired: 'red',
	}
	return map[status] || 'default'
}

const fetchData = async () => {
	loading.value = true
	try {
		const res = await getAdminCouponList({
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
			keyword: searchForm.value.keyword || undefined,
			status: searchForm.value.status as any,
			source: searchForm.value.source,
		})
		dataSource.value = res.data?.list || []
		pagination.value.total = res.data?.total || 0
	} finally {
		loading.value = false
	}
}

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current
	pagination.value.pageSize = pag.pageSize
	fetchData()
}

const handleSearch = () => {
	pagination.value.current = 1
	fetchData()
}

const handleReset = () => {
	searchForm.value = { keyword: '', status: undefined, source: undefined }
	pagination.value.current = 1
	fetchData()
}

const openIssueModal = () => {
	issueModalVisible.value = true
}

onMounted(fetchData)
</script>

<style scoped>
.search-form {
	margin-bottom: 16px;
}
</style>
