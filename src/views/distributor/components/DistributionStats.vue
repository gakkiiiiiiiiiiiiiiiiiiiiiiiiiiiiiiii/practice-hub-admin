<template>
	<div class="distribution-stats">
		<a-row :gutter="16" style="margin-bottom: 24px">
			<a-col :span="6">
				<a-card>
					<a-statistic
						title="分销用户总数"
						:value="stats.total_distributors || 0"
						:value-style="{ color: '#1890ff' }"
					/>
				</a-card>
			</a-col>
			<a-col :span="6">
				<a-card>
					<a-statistic
						title="已通过审核"
						:value="stats.approved_distributors || 0"
						:value-style="{ color: '#52c41a' }"
					/>
				</a-card>
			</a-col>
			<a-col :span="6">
				<a-card>
					<a-statistic
						title="分销关系总数"
						:value="stats.total_relations || 0"
						:value-style="{ color: '#722ed1' }"
					/>
				</a-card>
			</a-col>
			<a-col :span="6">
				<a-card>
					<a-statistic
						title="累计分成总额"
						:value="stats.total_commissions || 0"
						:precision="2"
						prefix="¥"
						:value-style="{ color: '#fa8c16' }"
					/>
				</a-card>
			</a-col>
		</a-row>

		<a-card>
			<template #title>分销数据概览</template>
			<div style="text-align: center; padding: 40px; color: #999">
				更多详细统计数据功能开发中...
			</div>
		</a-card>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getDistributionStats } from '@/api/distributor';

const stats = ref({
	total_distributors: 0,
	approved_distributors: 0,
	total_relations: 0,
	total_commissions: 0,
});

onMounted(() => {
	loadStats();
});

const loadStats = async () => {
	try {
		const res = await getDistributionStats();
		if (res) {
			stats.value = {
				total_distributors: res.total_distributors || 0,
				approved_distributors: res.approved_distributors || 0,
				total_relations: res.total_relations || 0,
				total_commissions: Number(res.total_commissions || 0),
			};
		}
	} catch (error: any) {
		message.error(error.msg || '加载统计数据失败');
	}
};
</script>

<style scoped lang="scss">
.distribution-stats {
	padding: 24px;
}
</style>

