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
            <a-select-option :value="0">待使用</a-select-option>
            <a-select-option :value="1">已使用</a-select-option>
            <a-select-option :value="2">已作废</a-select-option>
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
                record.status === 0
                  ? 'blue'
                  : record.status === 1
                  ? 'green'
                  : 'red'
              "
            >
              {{
                record.status === 0
                  ? '待使用'
                  : record.status === 1
                  ? '已使用'
                  : '已作废'
              }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'used_time'">
            <span v-if="record.used_time">
              {{ dayjs(record.used_time).format('YYYY-MM-DD HH:mm:ss') }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'create_time'">
            <span>{{ dayjs(record.create_time).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="handleViewDetail(record)"
              >
                <template #icon><EyeOutlined /></template>
                详情
              </a-button>
              <a-button
                v-if="record.status === 0"
                type="link"
                size="small"
                @click="handleExport(record)"
              >
                导出
              </a-button>
              <a-button
                v-if="record.status === 0"
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
              >
                <template #icon><DeleteOutlined /></template>
                删除
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

    <!-- 统计卡片 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="6">
        <a-card>
          <a-statistic title="总数" :value="statistics.total" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="待使用" :value="statistics.pending" value-style="color: #1890ff" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="已使用" :value="statistics.used" value-style="color: #52c41a" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="已作废" :value="statistics.invalid" value-style="color: #ff4d4f" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="激活码详情"
      width="600px"
      :footer="null"
    >
      <a-descriptions v-if="currentDetail" :column="2" bordered>
        <a-descriptions-item label="激活码">
          <span>{{ currentDetail.code }}</span>
          <a-button
            type="link"
            size="small"
            style="margin-left: 8px"
            @click="handleCopy(currentDetail.code)"
          >
            复制
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="批次号">
          {{ currentDetail.batch_id }}
        </a-descriptions-item>
        <a-descriptions-item label="关联课程">
          {{ currentDetail.course?.name || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag
            :color="
              currentDetail.status === 0
                ? 'blue'
                : currentDetail.status === 1
                ? 'green'
                : 'red'
            "
          >
            {{
              currentDetail.status === 0
                ? '待使用'
                : currentDetail.status === 1
                ? '已使用'
                : '已作废'
            }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ dayjs(currentDetail.create_time).format('YYYY-MM-DD HH:mm:ss') }}
        </a-descriptions-item>
        <a-descriptions-item v-if="currentDetail.used_time" label="激活时间">
          {{ dayjs(currentDetail.used_time).format('YYYY-MM-DD HH:mm:ss') }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:open="deleteModalVisible"
      title="删除激活码"
      :confirm-loading="deleteLoading"
      @ok="confirmDelete"
      @cancel="handleCancelDelete"
    >
      <p>确定要删除这条激活码吗？删除后无法恢复。</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, ShoppingCartOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'
import {
  getActivationCodeList,
  exportActivationCodes,
  deleteActivationCode,
  getActivationCodeStatistics,
  getActivationCodeDetail,
} from '@/api/agent'
import GenerateModal from './components/GenerateModal.vue'
import BuyModal from './components/BuyModal.vue'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.hasRole('super_admin'))

const loading = ref(false)
const dataSource = ref([])
const generateModalVisible = ref(false)
const buyModalVisible = ref(false)
const statistics = ref({
  total: 0,
  pending: 0,
  used: 0,
  invalid: 0,
})
const detailModalVisible = ref(false)
const currentDetail = ref<any>(null)
const deleteModalVisible = ref(false)
const deletingId = ref<number | null>(null)
const deleteLoading = ref(false)

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
    dataIndex: 'batch_id',
    key: 'batch_id',
  },
  {
    title: '关联课程',
    dataIndex: 'courseName',
    key: 'courseName',
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '激活时间',
    dataIndex: 'used_time',
    key: 'used_time',
    width: 180,
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getActivationCodeList({
      batchNo: searchForm.value.batchNo,
      status: searchForm.value.status,
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

const fetchStatistics = async () => {
  try {
    const res = await getActivationCodeStatistics()
    statistics.value = res.data
  } catch (error) {
    console.error('获取统计信息失败:', error)
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

const handleViewDetail = async (record: any) => {
  try {
    const res = await getActivationCodeDetail(record.id)
    currentDetail.value = res.data
    detailModalVisible.value = true
  } catch (error: any) {
    message.error(error?.message || '获取详情失败')
  }
}

const handleDelete = (record: any) => {
  deletingId.value = record.id
  deleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (!deletingId.value) return

  deleteLoading.value = true
  try {
    await deleteActivationCode(deletingId.value)
    message.success('删除成功')
    deleteModalVisible.value = false
    deletingId.value = null
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    message.error(error?.message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}

const handleCancelDelete = () => {
  deleteModalVisible.value = false
  deletingId.value = null
}

const handleExport = async (record: any) => {
  try {
    const blob = await exportActivationCodes({
      batchNo: record.batch_id,
      status: 0,
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `激活码_${record.batch_id}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败')
  }
}

const handleRefresh = () => {
  fetchData()
  fetchStatistics()
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
  fetchStatistics()
})
</script>

<style scoped lang="scss">
.activation-code {
  .search-form {
    margin-bottom: 16px;
  }
}
</style>

