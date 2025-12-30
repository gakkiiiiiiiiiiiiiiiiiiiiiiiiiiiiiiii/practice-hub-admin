import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getUserInfo as fetchUserInfo } from '@/api/user'
import { setToken, getToken, setUserInfo, removeToken, removeUserInfo } from '@/utils/auth'
import router from '@/router'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  permissions?: string[]
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const userInfo = ref<UserInfo | null>(null)
  const roles = ref<string[]>([])

  // 登录
  const loginAction = async (username: string, password: string) => {
    try {
      const res = await login({ username, password })
      // 后端返回格式：{ token, admin: { id, username, role, balance } }
      const { token: newToken, admin: adminData } = res.data
      
      // 将后端返回的管理员数据转换为前端需要的格式
      const info = {
        id: adminData.id,
        username: adminData.username,
        nickname: adminData.username, // 如果没有 nickname，使用 username
        avatar: '',
        roles: [adminData.role], // 后端返回的是 role，转换为数组
        permissions: [],
      }
      
      token.value = newToken
      setToken(newToken)
      setUserInfo(info)
      userInfo.value = info
      roles.value = [adminData.role]
      
      return res
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const res = await fetchUserInfo()
      const userData = res.data
      
      // 将后端返回的数据转换为前端需要的格式
      const info = {
        id: userData.id,
        username: userData.username || '',
        nickname: userData.nickname || '',
        avatar: userData.avatar || '',
        roles: userData.role ? [userData.role] : [],
        permissions: userData.permissions || [],
      }
      
      userInfo.value = info
      roles.value = info.roles
      setUserInfo(info)
      return info
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    userInfo.value = null
    roles.value = []
    removeToken()
    removeUserInfo()
    router.push('/login')
  }

  // 检查是否有权限
  const hasRole = (role: string): boolean => {
    return roles.value.includes(role)
  }

  const hasPermission = (permission: string): boolean => {
    return userInfo.value?.permissions?.includes(permission) || false
  }

  return {
    token,
    userInfo,
    roles,
    loginAction,
    getUserInfo,
    logout,
    hasRole,
    hasPermission,
  }
})

