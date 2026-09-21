<template>
	<div class="distributor-page">
		<a-page-header title="代理配置" sub-title="统一配置推广海报、各级佣金和结算规则" />
		<a-card :bordered="false"><DistributionConfig /></a-card>
	</div>
</template>

<script setup lang="ts">
import DistributionConfig from './components/DistributionConfig.vue';
</script>

<style scoped>
.distributor-page {
	padding: 24px;
}
</style>
