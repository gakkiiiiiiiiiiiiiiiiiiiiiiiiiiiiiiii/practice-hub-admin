<template>
  <div class="error-page">
    <a-result
      status="403"
      title="403"
      sub-title="抱歉，您没有权限访问此页面"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="handleGoHome">返回首页</a-button>
          <a-button @click="handleGoLogin">返回登录</a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 根据角色获取默认首页
const getDefaultPath = (): string => {
  const role = userStore.roles?.[0]
  switch (role) {
    case 'super_admin':
      return '/dashboard/analysis'
    case 'content_admin':
      return '/question/subject'
    case 'agent':
      return '/dashboard/agent-workbench'
    default:
      return '/dashboard'
  }
}

const handleGoHome = () => {
  const defaultPath = getDefaultPath()
  router.push(defaultPath)
}

const handleGoLogin = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>

