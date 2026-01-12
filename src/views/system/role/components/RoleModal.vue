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
			<a-form-item v-if="record" label="角色标识">
				<a-input :value="record.value" disabled />
			</a-form-item>
			<a-form-item v-if="record" label="角色名称">
				<a-input :value="record.name" disabled />
			</a-form-item>
			<a-form-item v-if="record?.isSystem" label="提示">
				<a-alert message="系统角色不能修改权限" type="warning" show-icon />
			</a-form-item>
			<a-form-item v-else-if="record" label="权限配置" name="permissions">
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
import { updateRole, getPermissionGroups } from '@/api/system';

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
	permissions: [] as string[],
});

const rules = {
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
			if (props.record) {
				formState.value = {
					permissions: props.record.permissions || [],
				};
			} else {
				formState.value = {
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

		await updateRole(props.record.value, {
			permissions: formState.value.permissions,
		});
		message.success('更新成功');

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
