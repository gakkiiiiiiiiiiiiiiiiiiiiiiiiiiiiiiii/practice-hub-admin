<template>
  <div class="balance-log">
    <a-card>
      <template #title>资金记录</template>

      <a-form :model="searchForm" layout="inline" class="search-form">
        <a-form-item label="类型">
          <a-select
            v-model:value="searchForm.type"
            placeholder="请选择"
            style="width: 150px"
            allow-clear
          >
            <a-select-option value="recharge">充值</a-select-option>
            <a-select-option value="consume">消费</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === 'recharge' ? 'green' : 'red'">
              {{ record.type === 'recharge' ? '充值' : '消费' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span
              :style="{
                color: record.type === 'recharge' ? '#52c41a' : '#ff4d4f',
              }"
            >
              {{ record.type === 'recharge' ? '+' : '-' }}¥{{ record.amount }}
            </span>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getBalanceLog } from '@/api/agent'

const loading = ref(false)
const dataSource = ref([])

const searchForm = ref({
  type: undefined,
})

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
})

const columns = [
  {
    title: '类型',
    key: 'type',
    width: 100,
  },
  {
    title: '金额',
    key: 'amount',
    width: 120,
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getBalanceLog({
      ...searchForm.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    message.error('获取资金记录失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchData()
}

const handleSearch = () => {
  pagination.value.current = 1
  fetchData()
}

const handleReset = () => {
  searchForm.value = {
    type: undefined,
  }
  handleSearch()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.balance-log {
  .search-form {
    margin-bottom: 16px;
  }
}
</style>

