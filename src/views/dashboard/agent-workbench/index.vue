<template>
  <div class="agent-workbench">
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-statistic
          title="账户余额"
          :value="stats.balance"
          prefix="¥"
          :value-style="{ color: '#3f8600' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="已购激活码总数"
          :value="stats.totalCodes"
          :value-style="{ color: '#1890ff' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="已激活数"
          :value="stats.activatedCodes"
          :value-style="{ color: '#52c41a' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="未激活数"
          :value="stats.unactivatedCodes"
          :value-style="{ color: '#faad14' }"
        />
      </a-col>
    </a-row>

    <a-card title="快捷操作" class="quick-actions">
      <a-space>
        <a-button type="primary" @click="handleBuyCodes">
          <template #icon><gift-outlined /></template>
          购买激活码
        </a-button>
        <a-button @click="handleExportCodes">
          <template #icon><download-outlined /></template>
          导出未激活码
        </a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { GiftOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { getAgentDashboard } from '@/api/dashboard'
import { exportActivationCodes } from '@/api/agent'

const router = useRouter()

const stats = ref({
  balance: 0,
  totalCodes: 0,
  activatedCodes: 0,
  unactivatedCodes: 0,
})

onMounted(async () => {
  try {
    const res = await getAgentDashboard()
    stats.value = res.data
  } catch (error) {
    console.error('获取代理商数据失败:', error)
  }
})

const handleBuyCodes = () => {
  router.push('/agent/activation-code?action=buy')
}

const handleExportCodes = async () => {
  try {
    const blob = await exportActivationCodes({ status: 0 })
    
    // 确保是 Blob 类型
    if (!(blob instanceof Blob)) {
      throw new Error('响应格式错误')
    }
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `未激活码_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    message.success('导出成功')
  } catch (error: any) {
    console.error('导出失败:', error)
    message.error(error?.message || '导出失败')
  }
}
</script>

<style scoped lang="scss">
.agent-workbench {
  .stats-row {
    margin-bottom: 24px;
  }

  .quick-actions {
    margin-top: 24px;
  }
}
</style>

