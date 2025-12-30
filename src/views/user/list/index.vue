<template>
  <div class="user-list">
    <a-card>
      <template #title>小程序用户</template>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <a-avatar :src="record.avatar" :size="40">
              {{ record.nickname?.[0] || 'U' }}
            </a-avatar>
          </template>
          <template v-else-if="column.key === 'vipStatus'">
            <a-tag :color="record.vipStatus ? 'gold' : 'default'">
              {{ record.vipStatus ? 'VIP' : '普通' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '已封禁' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewDetail(record)">
                查看详情
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 1"
                @click="handleToggleStatus(record)"
              >
                {{ record.status === 1 ? '封号' : '解封' }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <user-detail-modal
      v-model:open="detailModalVisible"
      :user-id="selectedUserId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getAppUserList, updateUserStatus } from '@/api/user'
import UserDetailModal from './components/UserDetailModal.vue'

const loading = ref(false)
const dataSource = ref([])
const detailModalVisible = ref(false)
const selectedUserId = ref<number | null>(null)

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
})

const columns = [
  {
    title: '头像',
    key: 'avatar',
    width: 80,
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
  },
  {
    title: 'OpenID',
    dataIndex: 'openId',
    key: 'openId',
    ellipsis: true,
  },
  {
    title: '注册时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '最后登录',
    dataIndex: 'lastLoginAt',
    key: 'lastLoginAt',
    width: 180,
  },
  {
    title: 'VIP状态',
    key: 'vipStatus',
    width: 100,
  },
  {
    title: '账号状态',
    key: 'status',
    width: 100,
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
    const res = await getAppUserList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchData()
}

const handleViewDetail = (record: any) => {
  selectedUserId.value = record.id
  detailModalVisible.value = true
}

const handleToggleStatus = async (record: any) => {
  try {
    await updateUserStatus(record.id, {
      status: record.status === 1 ? 0 : 1,
    })
    message.success('操作成功')
    fetchData()
  } catch (error) {
    message.error('操作失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.user-list {
  // 样式
}
</style>

