<template>
	<a-modal
		:open="open"
		:title="record ? '编辑角色权限' : '新增角色'"
		@cancel="handleCancel"
		@ok="handleSubmit"
		:confirmLoading="loading"
		width="800px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
			<a-form-item v-if="!record" label="角色标识" name="value">
				<a-input v-model:value="formState.value" placeholder="如：custom_role（只能包含字母、数字、下划线）" />
			</a-form-item>
			<a-form-item v-if="!record" label="角色名称" name="name">
				<a-input v-model:value="formState.name" placeholder="如：自定义角色" />
			</a-form-item>
			<a-form-item v-if="!record" label="角色描述" name="description">
				<a-textarea v-model:value="formState.description" placeholder="请输入角色描述" :rows="2" />
			</a-form-item>
			<a-form-item v-if="record" label="角色标识">
				<a-input :value="record.value" disabled />
			</a-form-item>
			<a-form-item v-if="record" label="角色名称">
				<a-input :value="record.name" disabled />
			</a-form-item>
			<a-form-item v-if="record?.isSystem" label="提示">
				<a-alert message="系统角色不能修改权限" type="warning" show-icon />
			</a-form-item>
			<a-form-item v-else label="权限配置" name="permissions">
				<a-checkbox-group v-model:value="formState.permissions" style="width: 100%">
					<div v-for="group in permissionGroups" :key="group.module" style="margin-bottom: 16px">
						<div style="font-weight: bold; margin-bottom: 8px; color: #1890ff">
							{{ getModuleName(group.module) }}
						</div>
						<a-row :gutter="[16, 8]">
							<a-col :span="8" v-for="permission in group.permissions" :key="permission">
								<a-checkbox :value="permission">{{ permission }}</a-checkbox>
							</a-col>
						</a-row>
					</div>
				</a-checkbox-group>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { createRole, updateRole, getPermissionGroups } from '@/api/system';

const props = defineProps<{
	open: boolean;
	record: any;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const formRef = ref();
const loading = ref(false);
const permissionGroups = ref<Array<{ module: string; permissions: string[] }>>([]);

const formState = ref({
	value: '',
	name: '',
	description: '',
	permissions: [] as string[],
});

const rules = {
	value: [
		{ required: true, message: '请输入角色标识', trigger: 'blur' },
		{ pattern: /^[a-z][a-z0-9_]*$/, message: '角色标识只能包含小写字母、数字、下划线，且必须以字母开头', trigger: 'blur' },
	],
	name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
	permissions: [{ required: true, message: '请至少选择一个权限', trigger: 'change' }],
};

const getModuleName = (module: string) => {
	const moduleMap: Record<string, string> = {
		dashboard: '仪表盘',
		question: '题目管理',
		course: '课程管理',
		chapter: '章节管理',
		agent: '代理商',
		user: '用户管理',
		system: '系统管理',
	};
	return moduleMap[module] || module;
};

const fetchPermissionGroups = async () => {
	try {
		const res = await getPermissionGroups();
		permissionGroups.value = res.data || [];
	} catch (error: any) {
		console.error('获取权限分组失败:', error);
	}
};

watch(
	() => props.open,
	(val) => {
		if (val) {
			// 打开弹窗时获取权限分组（确保数据是最新的）
			fetchPermissionGroups();
			
			if (props.record) {
				formState.value = {
					value: props.record.value || '',
					name: props.record.name || '',
					description: props.record.description || '',
					permissions: props.record.permissions || [],
				};
			} else {
				formState.value = {
					value: '',
					name: '',
					description: '',
					permissions: [],
				};
			}
		}
	}
);

onMounted(() => {
	fetchPermissionGroups();
});

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
};

const handleSubmit = async () => {
	if (props.record?.isSystem) {
		message.warning('系统角色不能修改权限');
		return;
	}

	try {
		await formRef.value?.validate();
		loading.value = true;

		if (props.record) {
			// 编辑角色权限
			await updateRole(props.record.id, {
				permissions: formState.value.permissions,
			});
			message.success('更新成功');
		} else {
			// 创建新角色
			await createRole({
				value: formState.value.value,
				name: formState.value.name,
				description: formState.value.description,
				permissions: formState.value.permissions,
			});
			message.success('创建成功');
		}

		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error(error?.message || '操作失败');
	} finally {
		loading.value = false;
	}
};
</script>
