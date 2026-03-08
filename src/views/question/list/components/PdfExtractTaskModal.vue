<template>
	<a-modal
		v-model:open="visible"
		title="文件题目提取"
		width="720"
		:footer="null"
		:destroy-on-close="false"
		@cancel="handleCancel"
	>
		<div class="pdf-extract-task-modal">
			<div class="upload-row">
				<a-upload
					:before-upload="handleUpload"
					:show-upload-list="false"
					accept=".pdf,.doc,.docx"
					:max-count="1"
					:disabled="uploading"
				>
					<template #default>
						<a-button type="primary" :loading="uploading">
							<template #icon><UploadOutlined /></template>
							{{ uploading ? '上传中...' : '选择 PDF 或 Word 上传并解析' }}
						</a-button>
					</template>
				</a-upload>
				<a-button
					:loading="refreshing"
					:disabled="tableData.length === 0"
					@click="handleRefresh"
					style="margin-left: auto"
				>
					<template #icon><ReloadOutlined /></template>
					刷新
				</a-button>
			</div>
			<a-table
				:columns="columns"
				:data-source="tableData"
				:row-key="(r) => r.taskId"
				:pagination="false"
				size="small"
				class="task-table"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag v-if="record.status === 'pending'" color="default">等待中</a-tag>
						<a-tag v-else-if="record.status === 'processing'" color="processing">解析中</a-tag>
						<a-tag v-else-if="record.status === 'completed'" color="success">已完成</a-tag>
						<a-tag v-else-if="record.status === 'failed'" color="error">失败</a-tag>
						<a-tag v-else>{{ record.status }}</a-tag>
					</template>
					<template v-else-if="column.key === 'progress'">
						<span v-if="record.progress">{{ record.progress }}</span>
						<span v-else-if="record.status === 'processing'" class="progress-loading">
							<a-spin size="small" /> 解析中...
						</span>
						<span v-else-if="record.status === 'pending'">等待中</span>
						<span v-else>-</span>
					</template>
					<template v-else-if="column.key === 'count'">
						<span v-if="record.result != null">{{ record.result.count }}</span>
						<span v-else>-</span>
					</template>
					<template v-else-if="column.key === 'action'">
						<template v-if="record.status === 'completed' && record.result?.data?.length">
							<a-tooltip v-if="record.error" :title="record.error">
								<span class="partial-hint">部分成功</span>
							</a-tooltip>
							<a-button type="link" size="small" @click="handleImport(record)">导入</a-button>
						</template>
						<span v-else-if="record.status === 'failed'" class="error-text">{{ record.error || '解析失败' }}</span>
						<span v-else>-</span>
					</template>
				</template>
			</a-table>
		</div>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { UploadOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { submitPdfExtractTask, getPdfExtractTask, extractQuestionsFromWord } from '@/api/question';

export interface PdfExtractTaskRow {
	taskId: string;
	fileName: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	progress?: string;
	result?: { count: number; data: any[] };
	error?: string;
	createdAt: number;
}

const props = defineProps<{
	open: boolean;
}>();

const emit = defineEmits<{
	'update:open': [value: boolean];
	import: [questions: any[]];
}>();

const visible = computed({
	get: () => props.open,
	set: (val) => emit('update:open', val),
});

const uploading = ref(false);
const refreshing = ref(false);
const tasks = ref<Map<string, PdfExtractTaskRow>>(new Map());
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null);

const columns = [
	{ title: '文件名', dataIndex: 'fileName', key: 'fileName', ellipsis: true },
	{ title: '状态', key: 'status', width: 90 },
	{ title: '进度', key: 'progress', width: 120 },
	{ title: '题目数', key: 'count', width: 80 },
	{ title: '操作', key: 'action', width: 100 },
];

const tableData = computed(() => {
	return Array.from(tasks.value.values()).sort((a, b) => b.createdAt - a.createdAt);
});

async function handleUpload(file: File): Promise<boolean> {
	const name = file.name.toLowerCase();
	const isWord = name.endsWith('.docx') || name.endsWith('.doc');
	const isPdf = name.endsWith('.pdf');
	if (!isWord && !isPdf) {
		message.error('仅支持 PDF 或 Word 文件（.pdf / .doc / .docx）');
		return false;
	}

	uploading.value = true;
	try {
		if (isWord) {
			const res = await extractQuestionsFromWord(file);
			const questions = res.data?.data ?? res.data ?? [];
			if (!Array.isArray(questions) || questions.length === 0) {
				message.warning('Word 文件中未提取到题目');
				return false;
			}
			emit('import', questions);
			message.success(`成功提取 ${questions.length} 道题目`);
			visible.value = false;
			return false;
		}
		// PDF：直接上传解析，识别不到文本时后端自动走 OCR
		const res = await submitPdfExtractTask(file, { direct: true });
		const payload = res.data ?? res;
		const taskId = payload.taskId;
		const fileName = payload.fileName ?? file.name;
		if (!taskId) {
			message.error('提交失败，未返回任务 ID');
			return false;
		}
		const row: PdfExtractTaskRow = {
			taskId,
			fileName,
			status: 'pending',
			createdAt: Date.now(),
		};
		tasks.value.set(taskId, row);
		tasks.value = new Map(tasks.value);
		startPolling();
	} catch (e: any) {
		message.error(e?.message || '上传失败');
	} finally {
		uploading.value = false;
	}
	return false; // 阻止默认上传
}

function startPolling() {
	if (pollTimer.value) return;
	pollTimer.value = setInterval(pollTasks, 2000);
}

function stopPolling() {
	if (pollTimer.value) {
		clearInterval(pollTimer.value);
		pollTimer.value = null;
	}
}

async function pollTasks() {
	const pending = Array.from(tasks.value.values()).filter(
		(t) => t.status === 'pending' || t.status === 'processing',
	);
	if (pending.length === 0) {
		stopPolling();
		return;
	}
	for (const t of pending) {
		try {
			const res = await getPdfExtractTask(t.taskId);
			const data = res.data ?? res;
			const updated = { ...t, ...data };
			tasks.value.set(t.taskId, updated);
		} catch (_) {}
	}
	tasks.value = new Map(tasks.value);
}

async function handleRefresh() {
	if (tasks.value.size === 0) return;
	refreshing.value = true;
	try {
		const list = Array.from(tasks.value.values());
		for (const t of list) {
			try {
				const res = await getPdfExtractTask(t.taskId);
				const data = res.data ?? res;
				tasks.value.set(t.taskId, { ...t, ...data });
			} catch (_) {}
		}
		tasks.value = new Map(tasks.value);
		message.success('已刷新');
	} finally {
		refreshing.value = false;
	}
}

function handleImport(record: PdfExtractTaskRow) {
	const list = record.result?.data;
	if (!list || !Array.isArray(list)) return;
	emit('import', list);
	message.success(`已导入 ${list.length} 道题目`);
	visible.value = false;
}

function handleCancel() {
	stopPolling();
	emit('update:open', false);
}

watch(
	() => props.open,
	(val) => {
		if (!val) stopPolling();
	},
);
</script>

<style scoped lang="scss">
.pdf-extract-task-modal {
	.upload-row {
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	.progress-loading {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.task-table {
		margin-top: 8px;
	}
	.error-text {
		color: var(--ant-color-error);
		font-size: 12px;
	}
	.partial-hint {
		font-size: 12px;
		color: var(--ant-color-warning);
		margin-right: 6px;
	}
}
</style>
