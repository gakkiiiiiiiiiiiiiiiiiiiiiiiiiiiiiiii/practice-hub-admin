<template>
  <div class="account-management">
    <a-card>
      <template #title>账号管理</template>
      <template #extra>
        <a-space>
          <a-form layout="inline" :model="searchForm" @finish="handleSearch">
            <a-form-item label="关键词">
              <a-input v-model:value="searchForm.keyword" placeholder="用户名" allow-clear style="width: 150px" />
            </a-form-item>
            <a-form-item label="状态">
              <a-select v-model:value="searchForm.status" placeholder="全部" style="width: 120px" allow-clear>
                <a-select-option :value="1">启用</a-select-option>
                <a-select-option :value="0">禁用</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="角色">
              <a-select v-model:value="searchForm.role" placeholder="全部" style="width: 120px" allow-clear>
                <a-select-option value="super_admin">系统管理员</a-select-option>
                <a-select-option value="content_admin">题库管理员</a-select-option>
                <a-select-option value="agent">代理商</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit">搜索</a-button>
            </a-form-item>
            <a-form-item>
              <a-button @click="handleReset">重置</a-button>
            </a-form-item>
          </a-form>
          <a-button type="primary" @click="handleAdd">
            <template #icon><plus-outlined /></template>
            新增账号
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'role'">
            <a-tag :color="getRoleColor(record.role)">
              {{ getRoleName(record.role) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'balance'">
            {{ record.balance ? `¥${record.balance.toFixed(2)}` : '¥0.00' }}
          </template>
          <template v-else-if="column.key === 'createdAt' || column.key === 'updatedAt'">
            {{ record[column.key] ? dayjs(record[column.key]).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 1"
                @click="handleToggleStatus(record)"
              >
                {{ record.status === 1 ? '禁用' : '启用' }}
              </a-button>
              <a-popconfirm
                title="确定要删除这个账号吗？"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <account-modal
      v-model:open="modalVisible"
      :record="currentRecord"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { getAccountList, deleteAccount, updateAccount } from '@/api/system'
import AccountModal from './components/AccountModal.vue'

const loading = ref(false)
const dataSource = ref([])
const modalVisible = ref(false)
const currentRecord = ref(null)

const searchForm = ref({
  keyword: '',
  status: undefined as number | undefined,
  role: undefined as string | undefined,
})

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    width: 150,
  },
  {
    title: '角色',
    key: 'role',
    width: 120,
  },
  {
    title: '余额',
    key: 'balance',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
]

const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    super_admin: '系统管理员',
    content_admin: '题库管理员',
    agent: '代理商',
  }
  return roleMap[role] || role
}

const getRoleColor = (role: string) => {
  const colorMap: Record<string, string> = {
    super_admin: 'red',
    content_admin: 'blue',
    agent: 'green',
  }
  return colorMap[role] || 'default'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAccountList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      role: searchForm.value.role,
    })
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error: any) {
    message.error(error?.message || '获取账号列表失败')
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
    keyword: '',
    status: undefined,
    role: undefined,
  }
  pagination.value.current = 1
  fetchData()
}

const handleAdd = () => {
  currentRecord.value = null
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  currentRecord.value = record
  modalVisible.value = true
}

const handleToggleStatus = async (record: any) => {
  try {
    await updateAccount(record.id, {
      status: record.status === 1 ? 0 : 1,
    })
    message.success('操作成功')
    fetchData()
  } catch (error: any) {
    message.error(error?.message || '操作失败')
  }
}

const handleDelete = async (record: any) => {
  try {
    await deleteAccount(record.id)
    message.success('删除成功')
    fetchData()
  } catch (error: any) {
    message.error(error?.message || '删除失败')
  }
}

const handleRefresh = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.account-management {
  // 样式
}
</style>

