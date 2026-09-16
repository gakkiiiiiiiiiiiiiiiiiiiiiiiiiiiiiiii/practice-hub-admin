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

		<a-card title="代理等级分布">
			<a-row :gutter="16">
				<a-col :span="8">
					<a-statistic title="初级代理" :value="stats.junior_distributors || 0" />
				</a-col>
				<a-col :span="8">
					<a-statistic title="中级代理" :value="stats.middle_distributors || 0" />
				</a-col>
				<a-col :span="8">
					<a-statistic title="高级代理" :value="stats.senior_distributors || 0" />
				</a-col>
			</a-row>
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
	junior_distributors: 0,
	middle_distributors: 0,
	senior_distributors: 0,
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
				junior_distributors: res.level_counts?.['1'] || 0,
				middle_distributors: res.level_counts?.['2'] || 0,
				senior_distributors: res.level_counts?.['3'] || 0,
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
