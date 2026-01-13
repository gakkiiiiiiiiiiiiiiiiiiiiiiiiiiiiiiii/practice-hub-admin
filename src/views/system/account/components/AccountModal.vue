<template>
  <a-modal
    :open="open"
    :title="record ? '编辑账号' : '新增账号'"
    @cancel="handleCancel"
    @ok="handleSubmit"
    :confirmLoading="loading"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item label="用户名" name="username">
        <a-input
          v-model:value="formState.username"
          :disabled="!!record"
          placeholder="请输入用户名"
        />
      </a-form-item>
      <a-form-item v-if="!record" label="密码" name="password">
        <a-input-password
          v-model:value="formState.password"
          placeholder="请输入密码"
        />
      </a-form-item>
      <a-form-item label="角色" name="role">
        <a-select v-model:value="formState.role" placeholder="请选择角色" :loading="roleList.length === 0">
          <a-select-option v-for="role in roleList" :key="role.value" :value="role.value">
            {{ role.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item v-if="record" label="状态" name="status">
        <a-radio-group v-model:value="formState.status">
          <a-radio :value="1">启用</a-radio>
          <a-radio :value="0">禁用</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { createAccount, updateAccount, getRoleList } from '@/api/system'

const props = defineProps<{
  open: boolean
  record: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const loading = ref(false)
const roleList = ref<Array<{ id: number; value: string; name: string }>>([])

const formState = ref({
  username: '',
  password: '',
  role: undefined as string | undefined,
  status: 1,
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: !props.record, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const fetchRoleList = async () => {
  try {
    const res = await getRoleList({ page: 1, pageSize: 100 })
    roleList.value = res.data.list.map((role: any) => ({
      id: role.id,
      value: role.value,
      name: role.name,
    }))
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.record) {
        formState.value = {
          username: props.record.username,
          password: '',
          role: props.record.role,
          status: props.record.status,
        }
      } else {
        formState.value = {
          username: '',
          password: '',
          role: undefined,
          status: 1,
        }
      }
    }
  }
)

onMounted(() => {
  fetchRoleList()
})

const handleCancel = () => {
  emit('update:open', false)
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const data = { ...formState.value }
    if (props.record && !data.password) {
      delete data.password
    }

    if (props.record) {
      await updateAccount(props.record.id, data)
      message.success('更新成功')
    } else {
      await createAccount(data)
      message.success('创建成功')
    }

    emit('success')
    emit('update:open', false)
  } catch (error: any) {
    if (error?.errorFields) {
      return
    }
    message.error('操作失败')
  } finally {
    loading.value = false
  }
}
</script>

