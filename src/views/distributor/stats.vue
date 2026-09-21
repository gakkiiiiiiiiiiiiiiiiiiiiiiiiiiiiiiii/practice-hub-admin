<template>
	<div class="distributor-page">
		<a-page-header title="代理数据统计" sub-title="汇总代理规模、关系和佣金数据" />
		<a-card :bordered="false"><DistributionStats /></a-card>
	</div>
</template>

<script setup lang="ts">
import DistributionStats from './components/DistributionStats.vue';
</script>

<style scoped>
.distributor-page {
	padding: 24px;
}
</style>
