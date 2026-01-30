<template>
	<div class="operation-log-management">
		<a-card>
			<template #title>系统操作日志</template>
			<template #extra>
				<a-button v-if="isMobile" type="text" @click="searchCollapsed = !searchCollapsed" class="search-toggle-btn">
					<template #icon>
						<filter-outlined v-if="searchCollapsed" />
						<close-outlined v-else />
					</template>
					{{ searchCollapsed ? '展开筛选' : '收起筛选' }}
				</a-button>
			</template>

			<!-- 搜索表单 -->
			<div class="search-form-wrapper" :class="{ collapsed: searchCollapsed && isMobile }">
				<a-form
					:model="searchForm"
					@finish="handleSearch"
					:label-col="isMobile ? { span: 24 } : { span: 6 }"
					:wrapper-col="isMobile ? { span: 24 } : { span: 18 }"
					layout="vertical"
					class="search-form"
				>
					<a-row :gutter="[16, 16]">
						<a-col :xs="24" :sm="12" :md="8" :lg="6">
							<a-form-item label="关键词">
								<a-input v-model:value="searchForm.keyword" placeholder="模块、操作、管理员" allow-clear />
							</a-form-item>
						</a-col>
						<a-col :xs="24" :sm="12" :md="8" :lg="6">
							<a-form-item label="操作人用户名">
								<a-input v-model:value="searchForm.adminUsername" placeholder="请输入用户名" allow-clear />
							</a-form-item>
						</a-col>
						<a-col :xs="24" :sm="12" :md="8" :lg="6">
							<a-form-item label="操作用户类型">
								<a-select v-model:value="searchForm.userType" placeholder="全部" allow-clear :loading="roleListLoading">
									<a-select-option v-for="role in roleList" :key="role.name" :value="role.name">
										{{ role.name }}
									</a-select-option>
								</a-select>
							</a-form-item>
						</a-col>
						<a-col :xs="24" :sm="12" :md="8" :lg="6">
							<a-form-item label="模块">
								<a-select v-model:value="searchForm.module" placeholder="全部" allow-clear>
									<a-select-option value="question">题库管理</a-select-option>
									<a-select-option value="course">课程管理</a-select-option>
									<a-select-option value="chapter">章节管理</a-select-option>
									<a-select-option value="activation-code">激活码管理</a-select-option>
									<a-select-option value="account">账号管理</a-select-option>
									<a-select-option value="role">角色管理</a-select-option>
									<a-select-option value="banner">轮播图管理</a-select-option>
									<a-select-option value="recommend">推荐管理</a-select-option>
								</a-select>
							</a-form-item>
						</a-col>
						<a-col :xs="24" :sm="12" :md="8" :lg="6">
							<a-form-item label="操作类型">
								<a-select v-model:value="searchForm.action" placeholder="全部" allow-clear>
									<a-select-option value="create">新增</a-select-option>
									<a-select-option value="update">更新</a-select-option>
									<a-select-option value="delete">删除</a-select-option>
									<a-select-option value="import">导入</a-select-option>
									<a-select-option value="generate">生成</a-select-option>
								</a-select>
							</a-form-item>
						</a-col>
						<a-col :xs="24" :sm="12" :md="8" :lg="6">
							<a-form-item label="时间范围">
								<a-range-picker
									v-model:value="dateRange"
									format="YYYY-MM-DD"
									:placeholder="['开始日期', '结束日期']"
									style="width: 100%"
								/>
							</a-form-item>
						</a-col>
						<a-col :xs="24" :sm="24" :md="24" :lg="24">
							<a-form-item>
								<a-space>
									<a-button type="primary" html-type="submit">搜索</a-button>
									<a-button @click="handleReset">重置</a-button>
								</a-space>
							</a-form-item>
						</a-col>
					</a-row>
				</a-form>
			</div>

			<!-- 移动端卡片式布局 -->
			<div v-if="isMobile" class="mobile-log-list">
				<div v-for="record in dataSource" :key="record.id" class="log-card" @click="handleViewDetail(record)">
					<div class="log-card-header">
						<span class="log-id">#{{ record.id }}</span>
						<span class="log-time">{{ record.createTime ? dayjs(record.createTime).format('MM-DD HH:mm') : '-' }}</span>
					</div>
					<div class="log-card-body">
						<div class="log-item">
							<span class="log-label">操作人：</span>
							<a-tag color="blue" size="small">{{ record.adminUsername }}</a-tag>
						</div>
						<div class="log-item">
							<span class="log-label">用户类型：</span>
							<a-tag :color="getUserTypeColor(record.userType)" size="small">
								{{ record.userType }}
							</a-tag>
						</div>
						<div class="log-item">
							<span class="log-label">模块：</span>
							<a-tag size="small">{{ record.module }}</a-tag>
						</div>
						<div class="log-item">
							<span class="log-label">操作：</span>
							<a-tag :color="getActionColor(record.action)" size="small">
								{{ getActionName(record.action) }}
							</a-tag>
						</div>
						<div v-if="record.ip" class="log-item">
							<span class="log-label">IP：</span>
							<span class="log-value">{{ record.ip }}</span>
						</div>
					</div>
					<div class="log-card-footer">
						<a-button type="link" size="small" @click.stop="handleViewDetail(record)"> 查看详情 </a-button>
					</div>
				</div>
				<div v-if="dataSource.length === 0 && !loading" class="empty-state">
					<a-empty description="暂无数据" />
				</div>
			</div>

			<!-- 桌面端表格布局 -->
			<div v-else class="table-wrapper">
				<a-table
					:columns="columns"
					:data-source="dataSource"
					:loading="loading"
					:pagination="pagination"
					@change="handleTableChange"
					row-key="id"
					:scroll="{ x: 'max-content' }"
					:size="isMobile ? 'small' : 'middle'"
					class="operation-log-table"
				>
					<template #bodyCell="{ column, record }">
						<template v-if="column.key === 'adminUsername'">
							<a-tag color="blue">{{ record.adminUsername }}</a-tag>
						</template>
						<template v-else-if="column.key === 'userType'">
							<a-tag :color="getUserTypeColor(record.userType)">
								{{ record.userType }}
							</a-tag>
						</template>
						<template v-else-if="column.key === 'module'">
							<a-tag>{{ record.module }}</a-tag>
						</template>
						<template v-else-if="column.key === 'action'">
							<a-tag :color="getActionColor(record.action)">
								{{ getActionName(record.action) }}
							</a-tag>
						</template>
						<template v-else-if="column.key === 'createTime'">
							{{ record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
						</template>
						<template v-else-if="column.key === 'content'">
							<a-button type="link" size="small" @click="handleViewDetail(record)"> 查看详情 </a-button>
						</template>
					</template>
				</a-table>
			</div>
		</a-card>

		<!-- 详情弹窗 -->
		<a-modal
			v-model:open="detailVisible"
			title="操作日志详情"
			:footer="null"
			:width="isMobile ? '95%' : '800px'"
			:wrap-class-name="isMobile ? 'mobile-modal' : ''"
		>
			<a-descriptions :column="isMobile ? 1 : 2" bordered v-if="currentRecord">
				<a-descriptions-item label="操作ID">{{ currentRecord.id }}</a-descriptions-item>
				<a-descriptions-item label="操作人用户名">
					<a-tag color="blue">{{ currentRecord.adminUsername }}</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="操作用户类型">
					<a-tag :color="getUserTypeColor(currentRecord.userType)">
						{{ currentRecord.userType }}
					</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="操作模块">
					<a-tag>{{ currentRecord.module }}</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="操作类型">
					<a-tag :color="getActionColor(currentRecord.action)">
						{{ getActionName(currentRecord.action) }}
					</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="目标ID" :span="2">
					{{ currentRecord.targetId || '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="IP地址" :span="2">
					{{ currentRecord.ip || '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="操作时间" :span="2">
					{{ currentRecord.createTime ? dayjs(currentRecord.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="操作内容" :span="2">
					<pre style="max-height: 300px; overflow: auto; background: #f5f5f5; padding: 12px; border-radius: 4px">{{
						formatContent(currentRecord.content)
					}}</pre>
				</a-descriptions-item>
			</a-descriptions>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import { FilterOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { getOperationLogs, getRoleList } from '@/api/system';
import type { TableColumnsType } from 'ant-design-vue';

interface LogRecord {
	id: number;
	adminId: number;
	adminUsername: string;
	userType: string;
	module: string;
	action: string;
	targetId?: number;
	content?: string;
	ip?: string;
	createTime: string;
}

const loading = ref(false);
const dataSource = ref<LogRecord[]>([]);
const detailVisible = ref(false);
const currentRecord = ref<LogRecord | null>(null);
const dateRange = ref<[Dayjs, Dayjs] | null>(null);
const roleList = ref<Array<{ name: string; value: string }>>([]);
const roleListLoading = ref(false);
const searchCollapsed = ref(true);
const windowWidth = ref(window.innerWidth);

// 判断是否为移动端
const isMobile = computed(() => windowWidth.value < 768);

// 监听窗口大小变化
const handleResize = () => {
	windowWidth.value = window.innerWidth;
};

onMounted(() => {
	fetchData();
	fetchRoleList();
	window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
	window.removeEventListener('resize', handleResize);
});

const searchForm = ref({
	keyword: '',
	adminUsername: '',
	userType: '',
	module: '',
	action: '',
});

const pagination = computed(() => ({
	current: paginationState.value.current,
	pageSize: paginationState.value.pageSize,
	total: paginationState.value.total,
	showTotal: (total: number) => `共 ${total} 条`,
	showSizeChanger: !isMobile.value,
	showQuickJumper: !isMobile.value,
	pageSizeOptions: ['10', '20', '50', '100'],
	simple: isMobile.value, // 移动端使用简单分页
	size: isMobile.value ? 'small' : 'default',
}));

const paginationState = ref({
	current: 1,
	pageSize: 20,
	total: 0,
});

const columns: TableColumnsType = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '操作人用户名',
		dataIndex: 'adminUsername',
		key: 'adminUsername',
		width: 140,
	},
	{
		title: '操作用户类型',
		dataIndex: 'userType',
		key: 'userType',
		width: 120,
	},
	{
		title: '操作模块',
		dataIndex: 'module',
		key: 'module',
		width: 120,
	},
	{
		title: '操作类型',
		dataIndex: 'action',
		key: 'action',
		width: 100,
	},
	{
		title: '目标ID',
		dataIndex: 'targetId',
		key: 'targetId',
		width: 100,
	},
	{
		title: 'IP地址',
		dataIndex: 'ip',
		key: 'ip',
		width: 140,
	},
	{
		title: '操作时间',
		dataIndex: 'createTime',
		key: 'createTime',
		width: 180,
	},
	{
		title: '操作内容',
		key: 'content',
		width: 100,
	},
];

const fetchData = async () => {
	loading.value = true;
	try {
		const params: any = {
			page: paginationState.value.current,
			pageSize: paginationState.value.pageSize,
		};

		if (searchForm.value.keyword) {
			params.keyword = searchForm.value.keyword;
		}
		if (searchForm.value.adminUsername) {
			params.adminUsername = searchForm.value.adminUsername;
		}
		if (searchForm.value.userType) {
			params.userType = searchForm.value.userType;
		}
		if (searchForm.value.module) {
			params.module = searchForm.value.module;
		}
		if (searchForm.value.action) {
			params.action = searchForm.value.action;
		}
		if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
			params.startTime = dateRange.value[0].format('YYYY-MM-DD') + ' 00:00:00';
			params.endTime = dateRange.value[1].format('YYYY-MM-DD') + ' 23:59:59';
		}

		const res = await getOperationLogs(params);
		if (res.code === 200 && res.data) {
			dataSource.value = res.data.list || [];
			paginationState.value.total = res.data.total || 0;
		} else {
			message.error(res.message || '获取操作日志失败');
		}
	} catch (error: any) {
		console.error('获取操作日志失败:', error);
		message.error(error.message || '获取操作日志失败');
	} finally {
		loading.value = false;
	}
};

const handleSearch = () => {
	paginationState.value.current = 1;
	fetchData();
};

const handleReset = () => {
	searchForm.value = {
		keyword: '',
		adminUsername: '',
		userType: '',
		module: '',
		action: '',
	};
	dateRange.value = null;
	paginationState.value.current = 1;
	fetchData();
};

const handleTableChange = (pag: any) => {
	paginationState.value.current = pag.current;
	paginationState.value.pageSize = pag.pageSize;
	fetchData();
};

const handleViewDetail = (record: LogRecord) => {
	currentRecord.value = record;
	detailVisible.value = true;
};

const getActionColor = (action: string) => {
	const colorMap: Record<string, string> = {
		create: 'green',
		update: 'blue',
		delete: 'red',
		import: 'orange',
		generate: 'purple',
	};
	return colorMap[action] || 'default';
};

const getActionName = (action: string) => {
	const nameMap: Record<string, string> = {
		create: '新增',
		update: '更新',
		delete: '删除',
		import: '导入',
		generate: '生成',
	};
	return nameMap[action] || action;
};

const getUserTypeColor = (userType: string) => {
	const colorMap: Record<string, string> = {
		系统管理员: 'red',
		题库管理员: 'blue',
		代理商: 'green',
	};
	return colorMap[userType] || 'default';
};

const formatContent = (content?: string) => {
	if (!content) return '无';
	try {
		const parsed = JSON.parse(content);
		return JSON.stringify(parsed, null, 2);
	} catch {
		return content;
	}
};

const fetchRoleList = async () => {
	roleListLoading.value = true;
	try {
		const res = await getRoleList({ page: 1, pageSize: 100 });
		if (res.code === 200 && res.data) {
			roleList.value = (res.data.list || []).map((role: any) => ({
				name: role.name,
				value: role.value,
			}));
		}
	} catch (error: any) {
		console.error('获取角色列表失败:', error);
	} finally {
		roleListLoading.value = false;
	}
};
</script>

<style scoped lang="scss">
.operation-log-management {
	pre {
		margin: 0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 12px;
		line-height: 1.5;
	}

	.search-toggle-btn {
		margin-right: -8px;
	}

	.search-form-wrapper {
		margin-bottom: 16px;
		transition: all 0.3s ease;

		&.collapsed {
			max-height: 0;
			overflow: hidden;
			margin-bottom: 0;
		}
	}

	.search-form {
		:deep(.ant-form-item-label) {
			padding-bottom: 4px;
		}
	}

	// 移动端卡片式布局
	.mobile-log-list {
		.log-card {
			background: #fff;
			border: 1px solid #f0f0f0;
			border-radius: 8px;
			padding: 12px;
			margin-bottom: 12px;
			cursor: pointer;
			transition: all 0.3s;

			&:hover {
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				border-color: #1890ff;
			}

			.log-card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 12px;
				padding-bottom: 8px;
				border-bottom: 1px solid #f0f0f0;

				.log-id {
					font-weight: 600;
					color: #1890ff;
					font-size: 14px;
				}

				.log-time {
					font-size: 12px;
					color: #8c8c8c;
				}
			}

			.log-card-body {
				.log-item {
					display: flex;
					align-items: center;
					margin-bottom: 8px;
					font-size: 14px;

					&:last-child {
						margin-bottom: 0;
					}

					.log-label {
						color: #8c8c8c;
						margin-right: 8px;
						min-width: 70px;
						flex-shrink: 0;
					}

					.log-value {
						color: #262626;
						word-break: break-all;
					}
				}
			}

			.log-card-footer {
				margin-top: 12px;
				padding-top: 8px;
				border-top: 1px solid #f0f0f0;
				text-align: right;
			}
		}

		.empty-state {
			padding: 40px 0;
		}

		// 移动端分页样式
		:deep(.ant-pagination) {
			margin-top: 16px;
			text-align: center;

			.ant-pagination-item,
			.ant-pagination-prev,
			.ant-pagination-next {
				margin: 0 4px;
			}

			.ant-pagination-simple-pager {
				display: inline-flex;
				align-items: center;
			}
		}
	}

	// 表格容器样式
	.table-wrapper {
		position: relative;
		overflow-x: auto;
		overflow-y: visible;
		-webkit-overflow-scrolling: touch; // iOS 平滑滚动

		// 自定义滚动条样式
		&::-webkit-scrollbar {
			height: 8px;
		}

		&::-webkit-scrollbar-track {
			background: #f1f1f1;
			border-radius: 4px;
		}

		&::-webkit-scrollbar-thumb {
			background: #c1c1c1;
			border-radius: 4px;
			transition: background 0.3s;

			&:hover {
				background: #a8a8a8;
			}
		}

		// Firefox 滚动条样式
		scrollbar-width: thin;
		scrollbar-color: #c1c1c1 #f1f1f1;
	}

	// 表格样式优化
	.operation-log-table {
		:deep(.ant-table) {
			font-size: 14px;
		}

		:deep(.ant-table-container) {
			overflow-x: auto;
			overflow-y: visible;
		}

		:deep(.ant-table-thead > tr > th) {
			padding: 12px 8px;
			font-weight: 600;
			white-space: nowrap;
		}

		:deep(.ant-table-tbody > tr > td) {
			padding: 12px 8px;
			white-space: nowrap;
		}

		:deep(.ant-table-tbody > tr:hover > td) {
			background: #fafafa;
		}

		// 确保固定列正常工作
		:deep(.ant-table-cell-fix-left),
		:deep(.ant-table-cell-fix-right) {
			background: #fff;
		}

		:deep(.ant-table-tbody > tr:hover .ant-table-cell-fix-left),
		:deep(.ant-table-tbody > tr:hover .ant-table-cell-fix-right) {
			background: #fafafa;
		}

		// 移动端表格优化
		@media (max-width: 768px) {
			:deep(.ant-table-thead > tr > th),
			:deep(.ant-table-tbody > tr > td) {
				padding: 8px 4px;
				font-size: 12px;
			}

			:deep(.ant-table-thead > tr > th) {
				font-size: 13px;
			}

			:deep(.ant-tag) {
				font-size: 11px;
				padding: 0 6px;
				margin: 2px;
			}

			:deep(.ant-btn-link) {
				font-size: 12px;
				padding: 0 4px;
			}
		}

		// 平板端优化
		@media (min-width: 768px) and (max-width: 1024px) {
			:deep(.ant-table-thead > tr > th),
			:deep(.ant-table-tbody > tr > td) {
				padding: 10px 6px;
				font-size: 13px;
			}
		}
	}
}

// 移动端弹窗样式
:deep(.mobile-modal) {
	.ant-modal {
		margin: 0;
		max-width: 100%;
		top: 0;
		padding-bottom: 0;
	}

	.ant-modal-content {
		height: 100vh;
		border-radius: 0;
		display: flex;
		flex-direction: column;
	}

	.ant-modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}

	.ant-descriptions-item-label {
		font-weight: 600;
		width: 100px;
	}

	pre {
		font-size: 11px;
		word-break: break-all;
		white-space: pre-wrap;
	}
}

// 响应式样式
@media (max-width: 768px) {
	.operation-log-management {
		:deep(.ant-card-head) {
			padding: 12px 16px;
		}

		:deep(.ant-card-body) {
			padding: 16px;
		}

		.search-form {
			:deep(.ant-form-item) {
				margin-bottom: 12px;
			}

			:deep(.ant-form-item-label) {
				padding-bottom: 4px;
			}
		}
	}
}

@media (max-width: 576px) {
	.operation-log-management {
		.mobile-log-list {
			.log-card {
				padding: 10px;

				.log-card-body {
					.log-item {
						font-size: 13px;

						.log-label {
							min-width: 60px;
							font-size: 12px;
						}
					}
				}
			}
		}
	}
}
</style>
