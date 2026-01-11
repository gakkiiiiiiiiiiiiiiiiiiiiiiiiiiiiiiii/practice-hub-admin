<template>
	<a-modal
		:open="open"
		:title="record ? '编辑角色' : '新增角色'"
		@cancel="handleCancel"
		@ok="handleSubmit"
		:confirmLoading="loading"
		width="600px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item label="角色标识" name="value">
				<a-input v-model:value="formState.value" :disabled="!!record" placeholder="如：super_admin" />
			</a-form-item>
			<a-form-item label="角色名称" name="name">
				<a-input v-model:value="formState.name" placeholder="如：系统管理员" />
			</a-form-item>
			<a-form-item label="菜单权限" name="menus">
				<a-checkbox-group v-model:value="formState.menus">
					<a-row>
						<a-col :span="8" v-for="menu in menuList" :key="menu.value">
							<a-checkbox :value="menu.value">{{ menu.label }}</a-checkbox>
						</a-col>
					</a-row>
				</a-checkbox-group>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { createRole, updateRole } from '@/api/system';

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

const menuList = [
	{ value: 'dashboard', label: '仪表盘' },
	{ value: 'question:course', label: '课程管理' },
	{ value: 'question:chapter', label: '章节管理' },
	{ value: 'question:list', label: '试题管理' },
	{ value: 'agent:code', label: '激活码管理' },
	{ value: 'agent:balance', label: '资金记录' },
	{ value: 'user:list', label: '小程序用户' },
	{ value: 'system:account', label: '账号管理' },
	{ value: 'system:role', label: '角色管理' },
	{ value: 'system:config', label: '运营配置' },
	{ value: 'system:distributor', label: '分销管理' },
];

const formState = ref({
	value: '',
	name: '',
	menus: [],
});

const rules = {
	value: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
	name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
	menus: [{ required: true, message: '请选择菜单权限', trigger: 'change' }],
};

watch(
	() => props.open,
	(val) => {
		if (val) {
			if (props.record) {
				formState.value = {
					...props.record,
					menus: props.record.menus || [],
				};
			} else {
				formState.value = {
					value: '',
					name: '',
					menus: [],
				};
			}
		}
	}
);

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		loading.value = true;

		if (props.record) {
			await updateRole(props.record.id, formState.value);
			message.success('更新成功');
		} else {
			await createRole(formState.value);
			message.success('创建成功');
		}

		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error('操作失败');
	} finally {
		loading.value = false;
	}
};
</script>
