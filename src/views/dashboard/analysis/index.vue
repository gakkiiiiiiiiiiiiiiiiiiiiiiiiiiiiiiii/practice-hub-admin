<template>
  <div class="dashboard-analysis">
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-statistic
          title="总用户数"
          :value="stats.totalUsers"
          :value-style="{ color: '#3f8600' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="今日新增用户"
          :value="stats.todayUsers"
          :value-style="{ color: '#1890ff' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="总收入"
          :value="stats.totalRevenue"
          prefix="¥"
          :value-style="{ color: '#cf1322' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="今日订单数"
          :value="stats.todayOrders"
          :value-style="{ color: '#722ed1' }"
        />
      </a-col>
    </a-row>

    <a-row :gutter="16" class="charts-row">
      <a-col :span="12">
        <a-card title="用户增长趋势">
          <div id="user-growth-chart" style="height: 300px"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="题库销售占比">
          <div id="sales-pie-chart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="charts-row">
      <a-col :span="24">
        <a-card title="代理商激活码核销排名">
          <div id="agent-ranking-chart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardAnalysis } from '@/api/dashboard'

const stats = ref({
  totalUsers: 0,
  todayUsers: 0,
  totalRevenue: 0,
  todayOrders: 0,
})

onMounted(async () => {
  try {
    const res = await getDashboardAnalysis()
    stats.value = res.data.stats
    // TODO: 初始化图表（需要引入 echarts 或 chart.js）
  } catch (error) {
    console.error('获取分析数据失败:', error)
  }
})
</script>

<style scoped lang="scss">
.dashboard-analysis {
  .stats-row {
    margin-bottom: 24px;
  }

  .charts-row {
    margin-bottom: 24px;
  }
}
</style>

