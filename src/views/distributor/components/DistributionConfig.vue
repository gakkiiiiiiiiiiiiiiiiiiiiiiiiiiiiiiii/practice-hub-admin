<template>
	<div class="distribution-config">
		<a-form
			:model="formState"
			:label-col="{ span: 6 }"
			:wrapper-col="{ span: 18 }"
			@finish="handleSubmit"
		>
			<a-form-item label="是否启用分销系统">
				<a-switch v-model:checked="formState.is_enabled" :checkedValue="1" :unCheckedValue="0" />
				<span style="margin-left: 12px; color: #999">
					{{ formState.is_enabled === 1 ? '已启用' : '已禁用' }}
				</span>
			</a-form-item>

			<a-form-item label="最大层级数">
				<a-input-number
					v-model:value="formState.max_level"
					:min="1"
					:max="10"
					style="width: 200px"
				/>
				<span style="margin-left: 12px; color: #999">最多支持几级分销（1-10级）</span>
			</a-form-item>

			<a-form-item label="各级分成比例">
				<div style="margin-bottom: 12px">
					<a-space v-for="(rate, index) in formState.commission_rates" :key="index" style="margin-bottom: 8px">
						<span>{{ index + 1 }}级：</span>
						<a-input-number
							v-model:value="formState.commission_rates[index]"
							:min="0"
							:max="100"
							:precision="2"
							style="width: 120px"
							addon-after="%"
						/>
						<a-button
							type="link"
							danger
							size="small"
							v-if="formState.commission_rates.length > 1"
							@click="removeRate(index)"
						>
							删除
						</a-button>
					</a-space>
				</div>
				<a-button type="dashed" @click="addRate" :disabled="formState.commission_rates.length >= formState.max_level">
					+ 添加层级
				</a-button>
				<div style="margin-top: 8px; color: #999; font-size: 12px">
					提示：分成比例总和不应超过100%，建议各级比例递减
				</div>
			</a-form-item>

			<a-form-item label="最低提现金额">
				<a-input-number
					v-model:value="formState.min_withdraw_amount"
					:min="0"
					:precision="2"
					style="width: 200px"
					addon-after="元"
				/>
			</a-form-item>

			<a-form-item label="分销说明">
				<a-textarea
					v-model:value="formState.description"
					:rows="4"
					placeholder="请输入分销说明，用户申请时会看到此说明"
				/>
			</a-form-item>

			<a-form-item :wrapper-col="{ offset: 6, span: 18 }">
				<a-button type="primary" html-type="submit" :loading="loading">保存配置</a-button>
				<a-button style="margin-left: 12px" @click="loadConfig">重置</a-button>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getDistributionConfig, updateDistributionConfig } from '@/api/distributor';

const loading = ref(false);
const formState = ref({
	max_level: 3,
	commission_rates: [10, 5, 2],
	min_withdraw_amount: 10,
	is_enabled: 1,
	description: '',
});

onMounted(() => {
	loadConfig();
});

const loadConfig = async () => {
	try {
		const res = await getDistributionConfig();
		if (res) {
			formState.value = {
				max_level: res.max_level || 3,
				commission_rates: Array.isArray(res.commission_rates)
					? res.commission_rates
					: JSON.parse(res.commission_rates || '[10, 5, 2]'),
				min_withdraw_amount: Number(res.min_withdraw_amount || 10),
				is_enabled: res.is_enabled !== undefined ? res.is_enabled : 1,
				description: res.description || '',
			};

			// 确保分成比例数组长度不超过最大层级数
			if (formState.value.commission_rates.length > formState.value.max_level) {
				formState.value.commission_rates = formState.value.commission_rates.slice(
					0,
					formState.value.max_level
				);
			}
		}
	} catch (error: any) {
		message.error(error.msg || '加载配置失败');
	}
};

const addRate = () => {
	if (formState.value.commission_rates.length < formState.value.max_level) {
		formState.value.commission_rates.push(0);
	}
};

const removeRate = (index: number) => {
	if (formState.value.commission_rates.length > 1) {
		formState.value.commission_rates.splice(index, 1);
	}
};

const handleSubmit = async () => {
	// 验证分成比例数组长度
	if (formState.value.commission_rates.length > formState.value.max_level) {
		message.warning(`分成比例层级数不能超过最大层级数（${formState.value.max_level}）`);
		return;
	}

	// 验证分成比例总和
	const totalRate = formState.value.commission_rates.reduce((sum, rate) => sum + rate, 0);
	if (totalRate > 100) {
		message.warning('分成比例总和不能超过100%');
		return;
	}

	loading.value = true;
	try {
		await updateDistributionConfig({
			max_level: formState.value.max_level,
			commission_rates: formState.value.commission_rates,
			min_withdraw_amount: formState.value.min_withdraw_amount,
			is_enabled: formState.value.is_enabled,
			description: formState.value.description,
		});
		message.success('配置保存成功');
	} catch (error: any) {
		message.error(error.msg || '保存失败');
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped lang="scss">
.distribution-config {
	padding: 24px;
}
</style>

