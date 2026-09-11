<template>
	<div class="paper-print-page">
		<a-card class="page-header" :bordered="false">
			<div class="page-heading">
				<div>
					<h2>纸质打印</h2>
					<p>集中处理纸质订单、获取云打印报价，并维护送印参数。</p>
				</div>
				<a-tag color="blue">运费单位：元</a-tag>
			</div>
		</a-card>

		<a-card :bordered="false">
			<a-tabs v-model:activeKey="activeTab">
				<a-tab-pane key="orders" tab="纸质订单">
					<a-alert
						type="info"
						show-icon
						message="获取报价不会生成付费订单"
						description="供应商文件与价格准备完成后，还需要再次确认打印费与运费，系统才会正式送印。"
						class="tab-alert"
					/>
					<order-list paper-only embedded />
				</a-tab-pane>
				<a-tab-pane key="config" tab="打印配置">
					<cloud-print-config />
				</a-tab-pane>
			</a-tabs>
		</a-card>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OrderList from '@/views/user/orders/index.vue'
import CloudPrintConfig from '@/views/system/config/components/CloudPrintConfig.vue'

const activeTab = ref('orders')
</script>

<style scoped>
.paper-print-page {
	display: grid;
	gap: 16px;
}

.page-heading {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
}

.page-heading h2 {
	margin: 0 0 6px;
	font-size: 20px;
}

.page-heading p {
	margin: 0;
	color: rgba(0, 0, 0, 0.55);
}

.tab-alert {
	margin-bottom: 16px;
}

@media (max-width: 720px) {
	.page-heading {
		flex-direction: column;
	}
}
</style>
