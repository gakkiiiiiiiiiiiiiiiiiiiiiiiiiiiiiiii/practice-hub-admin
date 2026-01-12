<template>
	<a-modal :open="open" title="用户详情" @cancel="handleCancel" :footer="null" width="800px">
		<a-spin :spinning="loading">
			<a-descriptions :column="2" bordered v-if="userInfo">
				<a-descriptions-item label="头像">
					<a-avatar :src="userInfo.avatar" :size="64">
						{{ userInfo.nickname?.[0] || 'U' }}
					</a-avatar>
				</a-descriptions-item>
				<a-descriptions-item label="昵称">
					{{ userInfo.nickname || '未设置' }}
				</a-descriptions-item>
				<a-descriptions-item label="OpenID">
					{{ userInfo.openId }}
				</a-descriptions-item>
				<a-descriptions-item label="手机号">
					{{ userInfo.phone || '未绑定' }}
				</a-descriptions-item>
				<a-descriptions-item label="VIP状态">
					<a-tag :color="userInfo.vipStatus ? 'gold' : 'default'">
						{{ userInfo.vipStatus ? 'VIP' : '普通用户' }}
					</a-tag>
					<span v-if="userInfo.vipExpireTime" style="margin-left: 8px; color: #999; font-size: 12px">
						(到期时间: {{ formatDate(userInfo.vipExpireTime) }})
					</span>
				</a-descriptions-item>
				<a-descriptions-item label="账号状态">
					<a-tag :color="userInfo.status === 1 ? 'green' : 'red'">
						{{ userInfo.status === 1 ? '正常' : '已封禁' }}
					</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="注册时间">
					{{ formatDate(userInfo.createdAt) }}
				</a-descriptions-item>
				<a-descriptions-item label="最后登录">
					{{ formatDate(userInfo.lastLoginAt) }}
				</a-descriptions-item>
			</a-descriptions>

			<a-divider>学习统计</a-divider>
			<a-descriptions :column="2" bordered>
				<a-descriptions-item label="总刷题数">
					{{ stats?.totalQuestions || 0 }}
				</a-descriptions-item>
				<a-descriptions-item label="正确数">
					{{ stats?.correctCount || 0 }}
				</a-descriptions-item>
				<a-descriptions-item label="错误数">
					{{ stats?.wrongCount || 0 }}
				</a-descriptions-item>
				<a-descriptions-item label="正确率">
					<a-tag :color="getAccuracyColor(stats?.accuracy)">
						{{ stats?.accuracy || '0%' }}
					</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="收藏数量">
					{{ stats?.collectionCount || 0 }}
				</a-descriptions-item>
				<a-descriptions-item label="课程权限数">
					{{ stats?.courseAuthCount || 0 }}
				</a-descriptions-item>
			</a-descriptions>

			<a-divider>错题本概览（最近10条）</a-divider>
			<a-table
				:columns="columns"
				:data-source="wrongQuestions"
				:pagination="{ pageSize: 5 }"
				size="small"
				v-if="wrongQuestions.length > 0"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'content'">
						<div style="max-width: 300px">{{ stripHtmlTags(record.content) }}</div>
					</template>
					<template v-else-if="column.key === 'lastErrorTime'">
						{{ formatDate(record.lastErrorTime) }}
					</template>
				</template>
			</a-table>
			<a-empty v-else description="暂无错题记录" />
		</a-spin>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getAppUserDetail } from '@/api/user';
import { stripHtmlTags } from '@/utils/sanitize';
import dayjs from 'dayjs';

const props = defineProps<{
	open: boolean;
	userId: number | null;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const userInfo = ref<any>(null);
const stats = ref<any>(null);
const wrongQuestions = ref([]);

const columns = [
	{
		title: '题目ID',
		dataIndex: 'questionId',
		key: 'questionId',
		width: 100,
	},
	{
		title: '题干',
		key: 'content',
		ellipsis: true,
	},
	{
		title: '错误次数',
		dataIndex: 'errorCount',
		key: 'errorCount',
		width: 100,
	},
	{
		title: '最后错误时间',
		key: 'lastErrorTime',
		width: 180,
	},
];

const fetchUserDetail = async () => {
	if (!props.userId) return;

	loading.value = true;
	try {
		const res = await getAppUserDetail(props.userId);
		// 处理API响应结构
		const data = res.data || res;
		userInfo.value = data.userInfo || data;
		stats.value = data.stats;
		wrongQuestions.value = data.wrongQuestions || [];
	} catch (error: any) {
		console.error('获取用户详情失败:', error);
	} finally {
		loading.value = false;
	}
};

watch(
	() => props.open,
	(val) => {
		if (val && props.userId) {
			fetchUserDetail();
		}
	}
);

const handleCancel = () => {
	emit('update:open', false);
};

const formatDate = (date: string | Date) => {
	if (!date) return '-';
	return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getAccuracyColor = (accuracy: string) => {
	if (!accuracy) return 'default';
	const percent = parseFloat(accuracy.replace('%', ''));
	if (percent >= 80) return 'green';
	if (percent >= 60) return 'orange';
	return 'red';
};
</script>
