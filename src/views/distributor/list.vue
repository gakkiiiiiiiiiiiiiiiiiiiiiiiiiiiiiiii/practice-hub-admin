<template>
	<div class="distributor-page">
		<a-page-header title="代理商列表" sub-title="查看全部代理商的等级、佣金、团队与销售数据" />
		<a-card :bordered="false"><DistributorList /></a-card>
	</div>
</template>

<script setup lang="ts">
import DistributorList from './components/DistributorList.vue';
</script>

<style scoped>
.distributor-page {
	padding: 24px;
}
</style>
