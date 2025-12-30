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
					{{ userInfo.nickname }}
				</a-descriptions-item>
				<a-descriptions-item label="OpenID">
					{{ userInfo.openId }}
				</a-descriptions-item>
				<a-descriptions-item label="VIP状态">
					<a-tag :color="userInfo.vipStatus ? 'gold' : 'default'">
						{{ userInfo.vipStatus ? 'VIP' : '普通' }}
					</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="注册时间">
					{{ userInfo.createdAt }}
				</a-descriptions-item>
				<a-descriptions-item label="最后登录">
					{{ userInfo.lastLoginAt }}
				</a-descriptions-item>
			</a-descriptions>

			<a-divider>刷题统计</a-divider>
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
					{{ stats?.accuracy || '0%' }}
				</a-descriptions-item>
			</a-descriptions>

			<a-divider>错题本概览</a-divider>
			<a-table :columns="columns" :data-source="wrongQuestions" :pagination="{ pageSize: 5 }" size="small">
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'content'">
						<div v-html="record.content" style="max-width: 300px"></div>
					</template>
				</template>
			</a-table>
		</a-spin>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getAppUserDetail } from '@/api/user';

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
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '题干',
		key: 'content',
		ellipsis: true,
	},
	{
		title: '课程',
		dataIndex: 'courseName',
		key: 'courseName',
		width: 100,
	},
];

const fetchUserDetail = async () => {
	if (!props.userId) return;

	loading.value = true;
	try {
		const res = await getAppUserDetail(props.userId);
		userInfo.value = res.data.userInfo;
		stats.value = res.data.stats;
		wrongQuestions.value = res.data.wrongQuestions || [];
	} catch (error) {
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
</script>
