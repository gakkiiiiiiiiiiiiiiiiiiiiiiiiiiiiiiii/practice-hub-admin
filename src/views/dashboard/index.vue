<template>
  <div class="dashboard">
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
          title="今日新增"
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
          title="今日订单"
          :value="stats.todayOrders"
          :value-style="{ color: '#722ed1' }"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardStats } from '@/api/dashboard'

const stats = ref({
  totalUsers: 0,
  todayUsers: 0,
  totalRevenue: 0,
  todayOrders: 0,
})

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  .stats-row {
    margin-bottom: 24px;
  }
}
</style>

