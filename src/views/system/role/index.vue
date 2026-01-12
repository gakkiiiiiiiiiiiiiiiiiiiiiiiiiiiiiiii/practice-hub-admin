<template>
  <div class="role-management">
    <a-card>
      <template #title>角色管理</template>
      <template #extra>
        <a-alert
          message="提示"
          description="系统默认提供三个角色：代理商、题库管理员、系统管理员。系统管理员角色不能修改权限。"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />
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
          <template v-if="column.key === 'name'">
            <a-space>
              <span>{{ record.name }}</span>
              <a-tag v-if="record.isSystem" color="red">系统角色</a-tag>
              <a-tag v-else color="blue">默认角色</a-tag>
            </a-space>
          </template>
          <template v-else-if="column.key === 'description'">
            <span>{{ record.description || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'permissions'">
            <a-space wrap>
              <a-tag v-for="permission in record.permissions" :key="permission" style="margin: 2px">
                {{ permission }}
              </a-tag>
              <span v-if="record.permissions.length === 0" style="color: #999">无权限</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'permissionCount'">
            <a-tag :color="record.permissionCount > 0 ? 'green' : 'default'">
              {{ record.permissionCount }} 项权限
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑权限
              </a-button>
              <a-button
                v-if="!record.isSystem"
                type="link"
                size="small"
                @click="handleViewDetail(record)"
              >
                查看详情
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <role-modal
      v-model:open="modalVisible"
      :record="currentRecord"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getRoleList, updateRole } from '@/api/system'
import RoleModal from './components/RoleModal.vue'

const loading = ref(false)
const dataSource = ref([])
const modalVisible = ref(false)
const currentRecord = ref(null)

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
    title: '角色标识',
    dataIndex: 'value',
    key: 'value',
    width: 150,
  },
  {
    title: '角色名称',
    key: 'name',
    width: 200,
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '权限数量',
    key: 'permissionCount',
    width: 120,
  },
  {
    title: '权限列表',
    key: 'permissions',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRoleList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error: any) {
    message.error(error?.message || '获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchData()
}

const handleEdit = (record: any) => {
  if (record.isSystem) {
    message.warning('系统角色不能修改权限')
    return
  }
  currentRecord.value = record
  modalVisible.value = true
}

const handleViewDetail = (record: any) => {
  currentRecord.value = record
  modalVisible.value = true
}

const handleRefresh = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.role-management {
  // 样式
}
</style>

