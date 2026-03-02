<template>
	<div class="checkin-config">
		<a-card>
			<template #title>刷题打卡配置</template>
			<a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" style="max-width: 600px">
				<a-form-item label="打卡所需时间" required>
					<a-input-number
						v-model:value="formState.minutes"
						:min="1"
						:max="1440"
						:precision="0"
						placeholder="请输入打卡所需时间（分钟）"
						style="width: 100%"
					/>
					<div style="margin-top: 8px; color: #999; font-size: 12px">
						用户需要刷题达到指定时间（分钟）才能打卡，建议设置为 30-60 分钟
					</div>
				</a-form-item>
				<a-form-item :wrapper-col="{ offset: 6, span: 18 }">
					<a-button type="primary" @click="handleSubmit" :loading="loading">保存配置</a-button>
				</a-form-item>
			</a-form>
		</a-card>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getCheckinMinutes, setCheckinMinutes } from '@/api/system';

const loading = ref(false);
const formState = ref({
	minutes: 30,
});

const fetchConfig = async () => {
	loading.value = true;
	try {
		const res = await getCheckinMinutes();
		if (res.data?.minutes) {
			formState.value.minutes = res.data.minutes;
		}
	} catch (error: any) {
		message.error(error?.message || '获取配置失败');
	} finally {
		loading.value = false;
	}
};

const handleSubmit = async () => {
	if (!formState.value.minutes || formState.value.minutes < 1) {
		message.error('打卡时间必须大于0');
		return;
	}

	loading.value = true;
	try {
		await setCheckinMinutes({ minutes: formState.value.minutes });
		message.success('配置保存成功');
	} catch (error: any) {
		message.error(error?.message || '保存失败');
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	fetchConfig();
});
</script>

<style scoped>
.checkin-config {
	padding: 0;
}
</style>
