<template>
  <div class="dashboard">
    <a-row :gutter="[16, 16]" class="stats-row">
      <a-col v-for="item in statCards" :key="item.key" :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            :title="item.title"
            :value="item.value"
            :precision="item.precision || 0"
            :prefix="item.prefix"
            :value-style="{ color: item.color }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="chart-card" :bordered="false">
      <template #title>
        <div class="chart-title">
          <span>近 7 天数据趋势</span>
          <span class="chart-subtitle">支持按图表类型快速切换</span>
        </div>
      </template>
      <template #extra>
        <a-radio-group v-model:value="chartType" button-style="solid">
          <a-radio-button value="bar">柱状图</a-radio-button>
          <a-radio-button value="line">折线图</a-radio-button>
          <a-radio-button value="pie">饼状图</a-radio-button>
        </a-radio-group>
      </template>

      <div v-if="chartType === 'bar'" class="bar-chart">
        <div v-for="item in chartSeries" :key="item.key" class="bar-chart__group">
          <div class="bar-chart__bars">
            <div
              v-for="point in item.points"
              :key="`${item.key}-${point.date}`"
              class="bar-chart__bar"
              :style="{ height: `${point.percent}%`, background: item.color }"
              :title="`${point.date} ${item.name}: ${point.value}`"
            />
          </div>
          <div class="bar-chart__name" :style="{ color: item.color }">{{ item.name }}</div>
        </div>
      </div>

      <div v-else-if="chartType === 'line'" class="line-chart">
        <svg viewBox="0 0 700 280" preserveAspectRatio="none" class="line-chart__svg">
          <polyline
            v-for="item in lineSeries"
            :key="item.key"
            :points="item.points"
            fill="none"
            :stroke="item.color"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <g v-for="item in lineSeries" :key="`${item.key}-dots`">
            <circle
              v-for="dot in item.dots"
              :key="`${item.key}-${dot.x}-${dot.y}`"
              :cx="dot.x"
              :cy="dot.y"
              r="4"
              :fill="item.color"
            />
          </g>
        </svg>
        <div class="line-chart__axis">
          <span v-for="item in trendData" :key="item.date">{{ item.date }}</span>
        </div>
      </div>

      <div v-else class="pie-chart">
        <div class="pie-chart__circle" :style="{ background: pieBackground }"></div>
        <div class="pie-chart__legend">
          <div v-for="item in pieItems" :key="item.key" class="pie-chart__legend-item">
            <span class="pie-chart__dot" :style="{ background: item.color }"></span>
            <span>{{ item.name }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>

      <div class="chart-legend">
        <span v-for="item in chartSeries" :key="item.key" class="chart-legend__item">
          <i :style="{ background: item.color }"></i>
          {{ item.name }}
        </span>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getDashboardStats } from '@/api/dashboard'

type ChartType = 'bar' | 'line' | 'pie'

interface TrendItem {
  date: string
  newUsers: number
  views: number
  orders: number
  revenue: number
}

const chartType = ref<ChartType>('bar')
const stats = ref({
  totalUsers: 0,
  todayUsers: 0,
  todayViews: 0,
  todayOrders: 0,
  monthOrders: 0,
  monthRevenue: 0,
  todayRevenue: 0,
  totalRevenue: 0,
  trend: [] as TrendItem[],
})

const money = (value: unknown) => Number(value || 0)

const statCards = computed(() => [
  { key: 'totalUsers', title: '总用户量', value: stats.value.totalUsers, color: '#3f8600' },
  { key: 'todayUsers', title: '日新增用户量', value: stats.value.todayUsers, color: '#1890ff' },
  { key: 'todayViews', title: '日浏览量', value: stats.value.todayViews, color: '#13c2c2' },
  { key: 'todayOrders', title: '日订单量', value: stats.value.todayOrders, color: '#722ed1' },
  { key: 'monthOrders', title: '本月订单量', value: stats.value.monthOrders, color: '#fa8c16' },
  { key: 'monthRevenue', title: '本月交易金额', value: money(stats.value.monthRevenue), prefix: '¥', precision: 2, color: '#cf1322' },
  { key: 'todayRevenue', title: '今日交易金额', value: money(stats.value.todayRevenue), prefix: '¥', precision: 2, color: '#eb2f96' },
])

const trendData = computed(() => stats.value.trend || [])

const chartSeries = computed(() => {
  const series = [
    { key: 'newUsers', name: '新增用户', color: '#1890ff' },
    { key: 'views', name: '浏览量', color: '#13c2c2' },
    { key: 'orders', name: '订单量', color: '#722ed1' },
    { key: 'revenue', name: '交易金额', color: '#cf1322' },
  ]
  const maxValue = Math.max(
    1,
    ...trendData.value.flatMap((item) => series.map((seriesItem) => Number((item as any)[seriesItem.key] || 0))),
  )
  return series.map((seriesItem) => ({
    ...seriesItem,
    points: trendData.value.map((item) => {
      const value = Number((item as any)[seriesItem.key] || 0)
      return {
        date: item.date,
        value,
        percent: Math.max(4, Math.round((value / maxValue) * 100)),
      }
    }),
  }))
})

const lineSeries = computed(() => {
  const width = 700
  const height = 260
  const top = 12
  const maxValue = Math.max(1, ...chartSeries.value.flatMap((item) => item.points.map((point) => point.value)))
  return chartSeries.value.map((item) => {
    const dots = item.points.map((point, index) => {
      const x = item.points.length <= 1 ? width / 2 : (index / (item.points.length - 1)) * width
      const y = top + height - (point.value / maxValue) * height
      return { x, y }
    })
    return {
      ...item,
      dots,
      points: dots.map((dot) => `${dot.x},${dot.y}`).join(' '),
    }
  })
})

const pieItems = computed(() => {
  const today = trendData.value[trendData.value.length - 1]
  return chartSeries.value.map((item) => ({
    key: item.key,
    name: item.name,
    color: item.color,
    value: Number((today as any)?.[item.key] || 0),
  }))
})

const pieBackground = computed(() => {
  const total = pieItems.value.reduce((sum, item) => sum + item.value, 0) || 1
  let start = 0
  const parts = pieItems.value.map((item) => {
    const end = start + (item.value / total) * 100
    const part = `${item.color} ${start}% ${end}%`
    start = end
    return part
  })
  return `conic-gradient(${parts.join(', ')})`
})

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    const data = res.data || {}
    stats.value = {
      totalUsers: data.totalUsers ?? data.user_count ?? 0,
      todayUsers: data.todayUsers ?? 0,
      todayViews: data.todayViews ?? 0,
      todayOrders: data.todayOrders ?? 0,
      monthOrders: data.monthOrders ?? data.order_count ?? 0,
      monthRevenue: money(data.monthRevenue),
      todayRevenue: money(data.todayRevenue),
      totalRevenue: money(data.totalRevenue ?? data.total_revenue),
      trend: data.trend || [],
    }
  } catch (error: any) {
    message.error(error?.message || '获取统计数据失败')
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  .stats-row {
    margin-bottom: 24px;
  }

  .stat-card {
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .chart-card {
    border-radius: 18px;
    box-shadow: 0 8px 26px rgba(15, 23, 42, 0.07);
  }

  .chart-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .chart-subtitle {
    color: #8c8c8c;
    font-size: 12px;
    font-weight: 400;
  }

  .bar-chart {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    min-height: 320px;
    padding: 16px 0;
  }

  .bar-chart__group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .bar-chart__bars {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 240px;
    padding: 14px;
    border-radius: 16px;
    background: linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%);
  }

  .bar-chart__bar {
    flex: 1;
    min-width: 8px;
    border-radius: 999px 999px 4px 4px;
    transition: height 0.25s ease;
  }

  .bar-chart__name {
    text-align: center;
    font-weight: 600;
  }

  .line-chart {
    padding: 18px 0 4px;
  }

  .line-chart__svg {
    width: 100%;
    height: 300px;
    border-radius: 16px;
    background:
      linear-gradient(#eef2f7 1px, transparent 1px),
      linear-gradient(90deg, #eef2f7 1px, transparent 1px),
      #fbfdff;
    background-size: 100% 25%, 14.28% 100%;
  }

  .line-chart__axis {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-top: 8px;
    color: #8c8c8c;
    font-size: 12px;
    text-align: center;
  }

  .pie-chart {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 48px;
    min-height: 320px;
  }

  .pie-chart__circle {
    width: 220px;
    height: 220px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 34px #fff, 0 16px 40px rgba(15, 23, 42, 0.12);
  }

  .pie-chart__legend {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 220px;
  }

  .pie-chart__legend-item {
    display: grid;
    grid-template-columns: 12px 1fr auto;
    align-items: center;
    gap: 10px;
  }

  .pie-chart__dot,
  .chart-legend__item i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    color: #5c667a;
  }

  .chart-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
