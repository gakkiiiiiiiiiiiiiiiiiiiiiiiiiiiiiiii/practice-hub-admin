<template>
	<div class="distributor-page">
		<a-page-header title="提现管理" sub-title="审核代理商提现申请并记录处理结果" />
		<a-card :bordered="false"><WithdrawalList /></a-card>
	</div>
</template>

<script setup lang="ts">
import WithdrawalList from './components/WithdrawalList.vue';
</script>

<style scoped>
.distributor-page {
	padding: 24px;
}
</style>
