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
								<div class="permission-item">
									<a-checkbox :value="permission" :title="permission">
										{{ getPermissionDisplayName(permission) }}
									</a-checkbox>
									<a-input-number
										class="permission-limit-input"
										:value="formState.permissionLimits[permission] ?? undefined"
										:min="1"
										:precision="0"
										size="small"
										placeholder="每日不限"
										:disabled="!formState.permissions.includes(permission)"
										@change="(value) => handlePermissionLimitChange(permission, value)"
									/>
								</div>
							</a-col>
						</a-row>
					</div>
				</a-checkbox-group>
				<div class="permission-limit-tip">每日调用次数留空表示无限制；填写后该权限每天最多可调用对应次数。</div>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { createRole, updateRole, getPermissionGroups } from '@/api/system';
import { getPermissionDisplayName, getPermissionModuleName } from '@/utils/permission-label';

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
const REQUIRED_PERMISSION_GROUPS = [
	{
		module: 'course',
		permissions: ['course:view', 'course:create', 'course:edit', 'course:status', 'course:delete'],
	},
];

const formState = ref({
	value: '',
	name: '',
	description: '',
	permissions: [] as string[],
	permissionLimits: {} as Record<string, number | null>,
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
	return getPermissionModuleName(module);
};

const fetchPermissionGroups = async () => {
	try {
		const res = await getPermissionGroups();
		permissionGroups.value = normalizePermissionGroups(res.data || []);
	} catch (error: any) {
		console.error('获取权限分组失败:', error);
	}
};

const normalizePermissionGroups = (groups: Array<{ module: string; permissions: string[] }>) => {
	const groupMap = new Map(groups.map((group) => [group.module, { ...group, permissions: [...group.permissions] }]));
	REQUIRED_PERMISSION_GROUPS.forEach((requiredGroup) => {
		const group = groupMap.get(requiredGroup.module) || { module: requiredGroup.module, permissions: [] };
		const permissions = new Set(group.permissions);
		requiredGroup.permissions.forEach((permission) => permissions.add(permission));
		group.permissions = requiredGroup.permissions
			.filter((permission) => permissions.has(permission))
			.concat([...permissions].filter((permission) => !requiredGroup.permissions.includes(permission)));
		groupMap.set(requiredGroup.module, group);
	});
	return [...groupMap.values()];
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
					permissionLimits: { ...(props.record.permissionLimits || {}) },
				};
			} else {
				formState.value = {
					value: '',
					name: '',
					description: '',
					permissions: [],
					permissionLimits: {},
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

const handlePermissionLimitChange = (permission: string, value: number | null) => {
	if (value === null || value === undefined) {
		formState.value.permissionLimits[permission] = null;
		return;
	}
	const limit = Number(value);
	formState.value.permissionLimits[permission] = Number.isInteger(limit) && limit > 0 ? limit : null;
};

const buildSelectedPermissionLimits = () => {
	const selected = new Set(formState.value.permissions);
	const limits: Record<string, number | null> = {};
	formState.value.permissions.forEach((permission) => {
		const value = formState.value.permissionLimits[permission];
		limits[permission] = value && value > 0 ? value : null;
	});
	Object.keys(formState.value.permissionLimits).forEach((permission) => {
		if (!selected.has(permission)) {
			delete formState.value.permissionLimits[permission];
		}
	});
	return limits;
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
				permissionLimits: buildSelectedPermissionLimits(),
			});
			message.success('更新成功');
		} else {
			// 创建新角色
			await createRole({
				value: formState.value.value,
				name: formState.value.name,
				description: formState.value.description,
				permissions: formState.value.permissions,
				permissionLimits: buildSelectedPermissionLimits(),
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

<style scoped lang="scss">
.permission-item {
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 32px;
}

.permission-limit-input {
	width: 96px;
	flex-shrink: 0;
}

.permission-limit-tip {
	margin-top: 8px;
	color: #8c8c8c;
	font-size: 12px;
}
</style>
