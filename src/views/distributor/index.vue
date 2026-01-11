<template>
	<div class="distributor-management">
		<a-card>
			<template #title>分销管理</template>

			<a-tabs v-model:activeKey="activeTab">
				<a-tab-pane key="list" tab="分销用户列表">
					<distributor-list />
				</a-tab-pane>
				<a-tab-pane key="config" tab="分销配置">
					<distribution-config />
				</a-tab-pane>
				<a-tab-pane key="stats" tab="数据统计">
					<distribution-stats />
				</a-tab-pane>
			</a-tabs>
		</a-card>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DistributorList from './components/DistributorList.vue';
import DistributionConfig from './components/DistributionConfig.vue';
import DistributionStats from './components/DistributionStats.vue';

const activeTab = ref('list');
</script>

<style scoped lang="scss">
.distributor-management {
	padding: 24px;
}
</style>

