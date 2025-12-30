<template>
  <div class="activation-code">
    <a-card>
      <template #title>激活码管理</template>
      <template #extra>
        <a-button
          v-if="isSuperAdmin"
          type="primary"
          @click="handleGenerate"
        >
          <template #icon><plus-outlined /></template>
          生成批次
        </a-button>
        <a-button
          v-else
          type="primary"
          @click="handleBuy"
        >
          <template #icon><shopping-cart-outlined /></template>
          购买激活码
        </a-button>
      </template>

      <a-form :model="searchForm" layout="inline" class="search-form">
        <a-form-item label="批次号">
          <a-input
            v-model:value="searchForm.batchNo"
            placeholder="请输入批次号"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择"
            style="width: 150px"
            allow-clear
          >
            <a-select-option value="pending">待使用</a-select-option>
            <a-select-option value="used">已使用</a-select-option>
            <a-select-option value="expired">已过期</a-select-option>
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
          <template v-if="column.key === 'code'">
            <a-space>
              <span>{{ maskCode(record.code) }}</span>
              <a-button
                type="link"
                size="small"
                @click="handleCopy(record.code)"
              >
                复制
              </a-button>
            </a-space>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag
              :color="
                record.status === 'pending'
                  ? 'blue'
                  : record.status === 'used'
                  ? 'green'
                  : 'red'
              "
            >
              {{
                record.status === 'pending'
                  ? '待使用'
                  : record.status === 'used'
                  ? '已使用'
                  : '已过期'
              }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'activatedUser'">
            <span v-if="record.activatedUser">
              {{ maskNickname(record.activatedUser) }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                v-if="record.status === 'pending'"
                type="link"
                size="small"
                @click="handleExport(record)"
              >
                导出
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <generate-modal
      v-if="isSuperAdmin"
      v-model:open="generateModalVisible"
      @success="handleRefresh"
    />
    <buy-modal
      v-else
      v-model:open="buyModalVisible"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getActivationCodeList,
  exportActivationCodes,
} from '@/api/agent'
import GenerateModal from './components/GenerateModal.vue'
import BuyModal from './components/BuyModal.vue'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.hasRole('super_admin'))

const loading = ref(false)
const dataSource = ref([])
const generateModalVisible = ref(false)
const buyModalVisible = ref(false)

const searchForm = ref({
  batchNo: undefined,
  status: undefined,
})

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
})

const columns = [
  {
    title: '激活码',
    key: 'code',
    width: 200,
  },
  {
    title: '批次号',
    dataIndex: 'batchNo',
    key: 'batchNo',
  },
  {
    title: '关联题库',
    dataIndex: 'courseName',
    key: 'courseName',
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '激活人',
    key: 'activatedUser',
    width: 120,
  },
  {
    title: '激活时间',
    dataIndex: 'activatedAt',
    key: 'activatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getActivationCodeList({
      ...searchForm.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    message.error('获取激活码列表失败')
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
    batchNo: undefined,
    status: undefined,
  }
  handleSearch()
}

const handleGenerate = () => {
  generateModalVisible.value = true
}

const handleBuy = () => {
  buyModalVisible.value = true
}

const handleCopy = (code: string) => {
  navigator.clipboard.writeText(code)
  message.success('已复制到剪贴板')
}

const handleExport = async (record: any) => {
  try {
    const blob = await exportActivationCodes({
      batchNo: record.batchNo,
      status: 'pending',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `激活码_${record.batchNo}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败')
  }
}

const handleRefresh = () => {
  fetchData()
}

const maskCode = (code: string) => {
  if (!code) return ''
  if (code.length <= 8) return code
  return code.substring(0, 4) + '****' + code.substring(code.length - 4)
}

const maskNickname = (nickname: string) => {
  if (!nickname) return ''
  if (nickname.length <= 2) return nickname
  return nickname[0] + '***' + nickname[nickname.length - 1]
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.activation-code {
  .search-form {
    margin-bottom: 16px;
  }
}
</style>

