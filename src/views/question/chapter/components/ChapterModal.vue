<template>
  <a-modal
    :open="open"
    :title="record ? '编辑章节' : '新增章节'"
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
      <a-form-item label="章节名称" name="name">
        <a-input v-model:value="formState.name" placeholder="如：2023年真题" />
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number
          v-model:value="formState.sort"
          :min="0"
          style="width: 100%"
          placeholder="数字越小越靠前"
        />
      </a-form-item>
      <a-form-item label="是否试读" name="is_free">
        <a-radio-group v-model:value="formState.is_free">
          <a-radio :value="0">否</a-radio>
          <a-radio :value="1">是</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createChapter, updateChapter } from '@/api/question'

const props = defineProps<{
  open: boolean
  record: any
  courseId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const loading = ref(false)

const formState = ref({
  name: '',
  sort: 0,
  is_free: 0, // 0-否, 1-是（试读）
})

const rules = {
  name: [{ required: true, message: '请输入章节名称', trigger: 'blur' }],
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.record) {
        // 映射后端字段到前端表单
        formState.value = {
          name: props.record.name || '',
          sort: props.record.sort || 0,
          is_free: props.record.is_free ?? 0,
        }
      } else {
        formState.value = {
          name: '',
          sort: 0,
          is_free: 0,
        }
      }
    }
  }
)

const handleCancel = () => {
  emit('update:open', false)
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    // 构建符合后端 DTO 的数据
    const data: any = {
      course_id: props.courseId,
      name: formState.value.name,
    }

    // 只添加有值的字段
    if (formState.value.sort !== undefined) {
      data.sort = formState.value.sort
    }
    if (formState.value.is_free !== undefined) {
      data.is_free = formState.value.is_free
    }

    if (props.record) {
      await updateChapter(props.record.id, data)
      message.success('更新成功')
    } else {
      await createChapter(data)
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

