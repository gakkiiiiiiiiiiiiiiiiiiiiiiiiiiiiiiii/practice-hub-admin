<template>
	<a-modal
		v-model:open="visible"
		title="JSON 导入题目"
		:width="modalWidth"
		wrap-class-name="json-import-modal-wrap"
		:confirm-loading="importLoading"
		@ok="handleImport"
		@cancel="handleCancel"
		:ok-button-props="{ disabled: !canImport }"
		:mask="true"
		:mask-closable="false"
		:centered="true"
		:destroy-on-close="false"
	>
		<a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" style="margin-bottom: 16px">
			<a-row :gutter="16">
				<a-col :span="12">
					<a-form-item label="课程" :required="true">
						<a-select
							v-model:value="form.courseId"
							placeholder="请选择课程"
							style="width: 100%"
							@change="handleCourseChange"
						>
							<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
								{{ course.name }}
							</a-select-option>
						</a-select>
					</a-form-item>
				</a-col>
				<a-col :span="12">
					<a-form-item label="章节" :required="true">
						<a-select
							v-model:value="form.chapterId"
							placeholder="请先选择课程"
							style="width: 100%"
							:disabled="!form.courseId"
						>
							<a-select-option v-for="chapter in chapterList" :key="chapter.id" :value="chapter.id">
								{{ chapter.name }}
							</a-select-option>
						</a-select>
					</a-form-item>
				</a-col>
			</a-row>
		</a-form>

		<a-row :gutter="16" class="content-row">
			<!-- 左侧：JSON 输入 -->
			<a-col :span="12">
				<div class="json-input-section">
					<div class="section-header">
						<span>JSON 数据输入</span>
						<div class="header-actions">
							<a-upload
								:before-upload="handlePdfUpload"
								:show-upload-list="false"
								accept=".pdf"
								:max-count="1"
							>
								<template #default>
									<a-button type="link" size="small" :loading="pdfExtracting">
										<template #icon><UploadOutlined /></template>
										{{ pdfExtracting ? '提取中...' : '上传PDF提取' }}
									</a-button>
								</template>
							</a-upload>
							<a-button type="link" size="small" @click="handleFormatJson">格式化</a-button>
						</div>
					</div>
					<a-textarea
						v-model:value="jsonInput"
						placeholder='请输入 JSON 格式数据，例如：&#10;[&#10;  {&#10;    "type": "单选",&#10;    "question": "题干内容",&#10;    "options": {"A": "选项A", "B": "选项B"},&#10;    "answer": "A",&#10;    "explanation": "解析内容"&#10;  }&#10;]'
						:rows="20"
						class="json-textarea"
						@input="handleJsonInput"
					/>
					<div v-if="jsonError" class="error-message">
						<a-alert type="error" :message="jsonError" show-icon />
					</div>
					<div v-else-if="parsedQuestions.length > 0" class="success-message">
						<a-alert type="success" :message="`已解析 ${parsedQuestions.length} 道题目`" show-icon />
					</div>
				</div>
			</a-col>

			<!-- 右侧：预览 -->
			<a-col :span="12">
				<div class="preview-section">
					<div class="section-header">
						<span>预览解析结果</span>
						<a-tag v-if="parsedQuestions.length > 0" color="green"> 共 {{ parsedQuestions.length }} 道题目 </a-tag>
					</div>
					<div class="preview-content">
						<div v-if="parsedQuestions.length === 0" class="empty-preview">
							<a-empty description="请输入 JSON 数据后预览" />
						</div>
						<div v-else class="question-list-wrapper">
							<div class="question-list">
								<div v-for="(question, index) in paginatedQuestions" :key="index" class="question-item">
									<!-- 题目头部：类型标签和编辑按钮 -->
									<div class="question-header-bar">
										<div class="header-left">
											<span class="question-type-tag" :class="getTypeTagClass(question.type)" :style="{ backgroundColor: getTypeColor(question.type) }">
												{{ question.type }}
											</span>
											<span class="question-index">第 {{ (currentPage - 1) * pageSize + index + 1 }} 题</span>
										</div>
										<div class="header-actions">
											<a-button
												v-if="editingQuestionIndex !== getGlobalQuestionIndex(index)"
												type="link"
												size="small"
												@click="handleStartEdit(index)"
											>
												编辑
											</a-button>
											<a-button
												v-if="editingQuestionIndex === getGlobalQuestionIndex(index)"
												type="link"
												size="small"
												@click="handleSaveEdit"
											>
												保存
											</a-button>
											<a-button
												v-if="editingQuestionIndex === getGlobalQuestionIndex(index)"
												type="link"
												size="small"
												@click="handleCancelEdit"
											>
												取消
											</a-button>
										</div>
									</div>
									
									<!-- 编辑模式 -->
									<template v-if="editingQuestionIndex === getGlobalQuestionIndex(index) && editingQuestion">
										<!-- 题型选择 -->
										<div class="edit-field">
											<label class="edit-label">题型：</label>
											<a-select
												v-model:value="editingQuestion.type"
												style="width: 150px"
												@change="handleTypeChange"
											>
												<a-select-option value="单选">单选</a-select-option>
												<a-select-option value="多选">多选</a-select-option>
												<a-select-option value="判断">判断</a-select-option>
												<a-select-option value="填空">填空</a-select-option>
												<a-select-option value="简答">简答</a-select-option>
												<a-select-option value="阅读理解">阅读理解</a-select-option>
											</a-select>
										</div>
										
										<!-- 题干编辑 -->
										<div class="edit-field">
											<label class="edit-label">题干：</label>
											<a-textarea
												v-model:value="editingQuestion.question"
												:rows="4"
												placeholder="请输入题干"
												style="width: 100%"
											/>
										</div>
										
										<!-- 选项编辑 -->
										<div v-if="editingQuestion.options && editingQuestion.options.length > 0" class="edit-field">
											<label class="edit-label">选项：</label>
											<div class="options-edit-list">
												<div
													v-for="(option, optIndex) in editingQuestion.options"
													:key="option.label"
													class="option-edit-item"
												>
													<span class="option-edit-label">{{ option.label }}：</span>
													<a-input
														v-model:value="option.text"
														:placeholder="`选项 ${option.label} 内容`"
														style="flex: 1"
													/>
													<a-button
														type="link"
														danger
														size="small"
														@click="handleRemoveOption(optIndex)"
													>
														删除
													</a-button>
												</div>
												<a-button
													type="dashed"
													size="small"
													style="width: 100%; margin-top: 8px"
													@click="handleAddOption"
												>
													+ 添加选项
												</a-button>
											</div>
										</div>
										
										<!-- 答案编辑 -->
										<div class="edit-field">
											<label class="edit-label">正确答案：</label>
											<a-input
												v-model:value="editingAnswerText"
												placeholder="单选题/判断题填单个答案（如：A），多选题填多个答案用逗号分隔（如：A,B）"
												style="width: 100%"
											/>
										</div>
										
										<!-- 解析编辑 -->
										<div class="edit-field">
											<label class="edit-label">解析：</label>
											<a-textarea
												v-model:value="editingQuestion.explanation"
												:rows="3"
												placeholder="请输入解析内容"
												style="width: 100%"
											/>
										</div>
									</template>
									
									<!-- 预览模式 -->
									<template v-else>
										<!-- 题干 -->
										<div class="question-body">
											<div class="question-content-text" v-html="question.question"></div>
										</div>
										
										<!-- 选项（选择题和判断题） -->
										<div v-if="question.options && question.options.length > 0" class="question-options">
											<div
												v-for="(option, optIndex) in question.options"
												:key="option.label"
												class="option-item"
												:class="{ 'is-answer': isAnswerOption(question.answer, option.label) }"
											>
												<div class="option-label" :class="{ 'is-answer': isAnswerOption(question.answer, option.label) }">
													{{ option.label }}
												</div>
												<div class="option-content" v-html="option.text"></div>
											</div>
										</div>
										
										<!-- 答案 -->
										<div class="question-answer-section">
											<div class="answer-label">正确答案：</div>
											<div class="answer-content">
												<span
													v-for="(ans, ansIndex) in (Array.isArray(question.answer) ? question.answer : [question.answer])"
													:key="ansIndex"
													class="answer-tag"
												>
													{{ ans }}
												</span>
											</div>
										</div>
										
										<!-- 解析 -->
										<div v-if="question.explanation" class="question-analysis">
											<div class="analysis-header">解析</div>
											<div class="analysis-content" v-html="question.explanation"></div>
										</div>
									</template>
								</div>
							</div>
							<div class="pagination-wrapper">
								<a-pagination
									v-model:current="currentPage"
									v-model:page-size="pageSize"
									:total="parsedQuestions.length"
									:show-size-changer="false"
									:show-quick-jumper="true"
									:page-size-options="['1']"
									:show-total="(total, range) => `第 ${range[0]}-${range[1]} 题，共 ${total} 道题目`"
									size="small"
								/>
							</div>
						</div>
					</div>
				</div>
			</a-col>
		</a-row>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { getCourseList } from '@/api/course';
import { getChapterList, extractQuestionsFromPdf } from '@/api/question';
import { importQuestionsFromJson } from '@/api/question';

interface JsonQuestion {
	type: string;
	question: string;
	options: Record<string, string>;
	answer: string;
	explanation: string;
}

interface ParsedQuestion {
	type: string;
	typeCode: number;
	question: string;
	options: Array<{ label: string; text: string }>;
	answer: string[];
	explanation: string;
}

const props = defineProps<{
	open: boolean;
}>();

const emit = defineEmits<{
	'update:open': [value: boolean];
	success: [];
}>();

const visible = computed({
	get: () => props.open,
	set: (val) => emit('update:open', val),
});

const jsonInput = ref('');
const jsonError = ref('');
const parsedQuestions = ref<ParsedQuestion[]>([]);
const importLoading = ref(false);
const pdfExtracting = ref(false);
const courseList = ref<any[]>([]);
const chapterList = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(1);
const windowWidth = ref(1200);
const editingQuestionIndex = ref<number | null>(null); // 当前正在编辑的题目索引（全局索引）
const editingQuestion = ref<ParsedQuestion | null>(null); // 编辑中的题目数据

// 计算弹窗宽度（响应式）
const modalWidth = computed(() => {
	return Math.min(1200, windowWidth.value - 80);
});

// 响应式窗口宽度
let resizeHandler: (() => void) | null = null;

onMounted(() => {
	windowWidth.value = window.innerWidth;
	resizeHandler = () => {
		windowWidth.value = window.innerWidth;
	};
	window.addEventListener('resize', resizeHandler);
});

onUnmounted(() => {
	if (resizeHandler) {
		window.removeEventListener('resize', resizeHandler);
	}
});

const form = ref({
	courseId: undefined as number | undefined,
	chapterId: undefined as number | undefined,
});

// 题型映射
const typeMap: Record<string, number> = {
	单选: 1,
	单选题: 1,
	多选: 2,
	多选题: 2,
	判断: 3,
	判断题: 3,
	填空: 4,
	填空题: 4,
	简答: 6,
	简答题: 6,
	阅读理解: 5,
};

// 题型颜色映射（对应小程序样式）
const getTypeColor = (type: string): string => {
	const colorMap: Record<string, string> = {
		单选: '#10b981', // 绿色
		多选: '#3498db', // 蓝色
		判断: '#9b59b6', // 紫色
		填空: '#f1c40f', // 黄色
		简答: '#e67e22', // 橙色
		阅读理解: '#e74c3c', // 红色
	};
	return colorMap[type] || '#e67e22'; // 默认橙色（简答题）
};

// 获取题型标签的类名
const getTypeTagClass = (type: string): string => {
	const classMap: Record<string, string> = {
		单选: 'type-single',
		多选: 'type-multiple',
		判断: 'type-judge',
		填空: 'type-fill',
		简答: 'type-short',
		阅读理解: 'type-reading',
	};
	return classMap[type] || 'type-short';
};

// 判断选项是否为答案
const isAnswerOption = (answer: string | string[], optionLabel: string): boolean => {
	if (Array.isArray(answer)) {
		return answer.some((ans) => String(ans).trim() === String(optionLabel).trim());
	}
	return String(answer).trim() === String(optionLabel).trim();
};

// 获取全局题目索引
const getGlobalQuestionIndex = (localIndex: number): number => {
	return (currentPage.value - 1) * pageSize.value + localIndex;
};

// 编辑答案文本（用于输入框）
const editingAnswerText = ref('');

// 开始编辑
const handleStartEdit = (localIndex: number) => {
	const globalIndex = getGlobalQuestionIndex(localIndex);
	const question = parsedQuestions.value[globalIndex];
	if (!question) return;
	
	editingQuestionIndex.value = globalIndex;
	editingQuestion.value = JSON.parse(JSON.stringify(question)); // 深拷贝
	// 将答案数组转换为文本
	if (Array.isArray(question.answer)) {
		editingAnswerText.value = question.answer.join(',');
	} else {
		editingAnswerText.value = String(question.answer);
	}
};

// 保存编辑
const handleSaveEdit = () => {
	if (!editingQuestion.value || editingQuestionIndex.value === null) return;
	
	// 更新题型代码
	const typeCode = typeMap[editingQuestion.value.type];
	if (typeCode) {
		editingQuestion.value.typeCode = typeCode;
	}
	
	// 解析答案文本
	let answer: string[] = [];
	if (editingAnswerText.value.trim()) {
		if (typeCode === 2 || typeCode === 4) {
			// 多选题或填空题：逗号分隔
			answer = editingAnswerText.value.split(',').map((a) => a.trim()).filter(Boolean);
		} else {
			// 单选题、判断题、简答题：单个答案
			answer = [editingAnswerText.value.trim()];
		}
	}
	editingQuestion.value.answer = answer;
	
	// 简答题和填空题不需要选项
	if (typeCode === 6 || typeCode === 4) {
		editingQuestion.value.options = [];
	}
	
	// 更新原数据
	parsedQuestions.value[editingQuestionIndex.value] = { ...editingQuestion.value };
	
	// 重置编辑状态
	editingQuestionIndex.value = null;
	editingQuestion.value = null;
	editingAnswerText.value = '';
	
	message.success('保存成功');
};

// 取消编辑
const handleCancelEdit = () => {
	editingQuestionIndex.value = null;
	editingQuestion.value = null;
	editingAnswerText.value = '';
};

// 题型变化处理
const handleTypeChange = (type: string) => {
	if (!editingQuestion.value) return;
	
	const typeCode = typeMap[type];
	if (typeCode) {
		editingQuestion.value.typeCode = typeCode;
	}
	
	// 简答题和填空题不需要选项
	if (typeCode === 6 || typeCode === 4) {
		editingQuestion.value.options = [];
	} else if (!editingQuestion.value.options || editingQuestion.value.options.length === 0) {
		// 如果是选择题但没有选项，添加默认选项
		editingQuestion.value.options = [
			{ label: 'A', text: '' },
			{ label: 'B', text: '' },
		];
	}
};

// 添加选项
const handleAddOption = () => {
	if (!editingQuestion.value || !editingQuestion.value.options) return;
	
	const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
	const existingLabels = editingQuestion.value.options.map((opt) => opt.label);
	const nextLabel = labels.find((label) => !existingLabels.includes(label));
	
	if (nextLabel) {
		editingQuestion.value.options.push({
			label: nextLabel,
			text: '',
		});
	} else {
		message.warning('最多只能添加8个选项');
	}
};

// 删除选项
const handleRemoveOption = (index: number) => {
	if (!editingQuestion.value || !editingQuestion.value.options) return;
	
	if (editingQuestion.value.options.length <= 2) {
		message.warning('至少需要保留2个选项');
		return;
	}
	
	editingQuestion.value.options.splice(index, 1);
};

// 格式化 JSON
const handleFormatJson = () => {
	if (!jsonInput.value.trim()) {
		message.warning('请输入 JSON 数据');
		return;
	}
	try {
		const parsed = JSON.parse(jsonInput.value);
		jsonInput.value = JSON.stringify(parsed, null, 2);
		message.success('格式化成功');
	} catch (error: any) {
		message.error('JSON 格式错误：' + error.message);
	}
};

// 解析 JSON 输入
const handleJsonInput = () => {
	jsonError.value = '';
	parsedQuestions.value = [];
	currentPage.value = 1; // 重置到第一页
	pageSize.value = 1; // 重置为每页1道题目

	if (!jsonInput.value.trim()) {
		return;
	}

	try {
		const data = JSON.parse(jsonInput.value);

		if (!Array.isArray(data)) {
			jsonError.value = 'JSON 数据必须是数组格式';
			return;
		}

		const questions: ParsedQuestion[] = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];

			// 验证必填字段
			if (!item.type) {
				jsonError.value = `第 ${i + 1} 道题目缺少 type 字段`;
				return;
			}
			if (!item.question) {
				jsonError.value = `第 ${i + 1} 道题目缺少 question 字段`;
				return;
			}
			if (!item.answer) {
				jsonError.value = `第 ${i + 1} 道题目缺少 answer 字段`;
				return;
			}

			// 转换题型：如果不在映射中，默认归类为简答题
			let typeCode = typeMap[item.type];
			let displayType = item.type;
			if (!typeCode) {
				// 未识别的类型，归类为简答题
				typeCode = 6; // 简答题类型代码
				displayType = '简答';
			} else {
				// 使用映射中的显示名称
				displayType = item.type;
			}

			// 转换选项格式：简答题和填空题不需要选项
			let options: Array<{ label: string; text: string }> = [];
			if (typeCode !== 6 && typeCode !== 4 && item.options && typeof item.options === 'object') {
				options = Object.keys(item.options)
					.sort()
					.map((key) => ({
						label: key,
						text: item.options[key],
					}));
			}

			// 转换答案格式
			let answer: string[] = [];
			if (typeof item.answer === 'string') {
				if (typeCode === 2) {
					// 多选题：逗号分隔
					answer = item.answer
						.split(',')
						.map((a: string) => a.trim())
						.filter(Boolean);
				} else if (typeCode === 4) {
					// 填空题：逗号分隔（多个空）
					answer = item.answer
						.split(',')
						.map((a: string) => a.trim())
						.filter(Boolean);
				} else {
					// 单选题、判断题、简答题：单个答案
					answer = [item.answer.trim()];
				}
			}

			questions.push({
				type: displayType,
				typeCode,
				question: item.question,
				options,
				answer,
				explanation: item.explanation || '',
			});
		}

		parsedQuestions.value = questions;
	} catch (error: any) {
		jsonError.value = 'JSON 解析失败：' + error.message;
	}
};

// 课程变化
const handleCourseChange = async (courseId: number) => {
	form.value.chapterId = undefined;
	if (!courseId) {
		chapterList.value = [];
		return;
	}
	try {
		const res = await getChapterList({ courseId });
		chapterList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取章节列表失败:', error);
		chapterList.value = [];
	}
};

// 分页后的题目列表
const paginatedQuestions = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value;
	const end = start + pageSize.value;
	return parsedQuestions.value.slice(start, end);
});

// 是否可以导入
const canImport = computed(() => {
	return !!form.value.courseId && !!form.value.chapterId && parsedQuestions.value.length > 0 && !jsonError.value;
});

// 导入
const handleImport = async () => {
	if (!canImport.value) {
		message.warning('请完善导入信息');
		return;
	}

	importLoading.value = true;
	try {
		await importQuestionsFromJson({
			chapterId: form.value.chapterId!,
			questions: parsedQuestions.value.map((q) => ({
				type: q.typeCode,
				stem: q.question,
				options: q.options,
				answer: q.answer,
				analysis: q.explanation,
			})),
		});
		message.success(`成功导入 ${parsedQuestions.value.length} 道题目`);
		emit('success');
		handleCancel();
	} catch (error: any) {
		message.error(error?.message || error?.msg || '导入失败');
	} finally {
		importLoading.value = false;
	}
};

// 取消
const handleCancel = () => {
	visible.value = false;
	jsonInput.value = '';
	jsonError.value = '';
	parsedQuestions.value = [];
	currentPage.value = 1;
	pageSize.value = 1;
	editingQuestionIndex.value = null;
	editingQuestion.value = null;
	editingAnswerText.value = '';
	form.value = {
		courseId: undefined,
		chapterId: undefined,
	};
	chapterList.value = [];
};

// 加载课程列表
const fetchCourses = async () => {
	try {
		const res = await getCourseList();
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

// PDF 上传处理
const handlePdfUpload = async (file: File): Promise<boolean> => {
	if (!file.name.toLowerCase().endsWith('.pdf')) {
		message.error('请上传 PDF 文件');
		return false;
	}

	pdfExtracting.value = true;
	try {
		const res = await extractQuestionsFromPdf(file);
		const questions = res.data?.data || res.data || [];
		
		if (!Array.isArray(questions) || questions.length === 0) {
			message.warning('PDF 文件中未提取到题目');
			return false;
		}

		// 将提取的题目转换为 JSON 格式
		const jsonData = JSON.stringify(questions, null, 2);
		jsonInput.value = jsonData;
		
		// 自动触发解析
		handleJsonInput();
		
		message.success(`成功提取 ${questions.length} 道题目`);
	} catch (error: any) {
		console.error('PDF 提取失败:', error);
		message.error(error?.message || error?.msg || 'PDF 提取失败，请检查文件格式');
	} finally {
		pdfExtracting.value = false;
	}

	return false; // 阻止自动上传
};

watch(
	() => props.open,
	(val) => {
		if (val) {
			fetchCourses();
		}
	},
);
</script>

<style scoped lang="scss">
.content-row {
	flex: 1;
	min-height: 0;
	display: flex;
	margin: 0 !important;
}

.json-input-section,
.preview-section {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	border: 1px solid #d9d9d9;
	border-radius: 4px;
	overflow: hidden;
}

.section-header {
	padding: 12px 16px;
	background: #fafafa;
	border-bottom: 1px solid #d9d9d9;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-weight: 500;

	.header-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}
}

.json-textarea {
	flex: 1;
	font-family: 'Courier New', monospace;
	font-size: 13px;
	resize: none;
	border: none;
	border-radius: 0;
}

.preview-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding: 16px;
}

.question-list-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.question-list {
	flex: 1;
	overflow-y: auto;
	margin-bottom: 16px;
}

.empty-preview {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.question-list {
	.question-item {
		margin-bottom: 32px;
		padding: 20px;
		background: #ffffff;
		border-radius: 8px;
		border: 1px solid #e8e8e8;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

		&:last-child {
			margin-bottom: 0;
		}
	}

	// 题目头部
	.question-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 1px solid #f0f0f0;

		.header-left {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.header-actions {
			display: flex;
			gap: 8px;
		}
	}

	.question-type-tag {
		padding: 4px 12px;
		border-radius: 4px;
		color: #ffffff;
		font-size: 12px;
		font-weight: 500;
		display: inline-block;
	}

	.question-index {
		font-size: 14px;
		color: #666;
		font-weight: 500;
	}

	// 题干
	.question-body {
		margin-bottom: 20px;
		padding: 8px 0;
	}

	.question-content-text {
		font-size: 15px;
		line-height: 1.8;
		color: #333;
		word-wrap: break-word;
		word-break: break-all;

		:deep(p) {
			margin: 0 0 8px 0;
			&:last-child {
				margin-bottom: 0;
			}
		}

		:deep(img) {
			max-width: 100%;
			height: auto;
		}
	}

	// 选项
	.question-options {
		margin-bottom: 20px;
	}

	.option-item {
		display: flex;
		align-items: flex-start;
		padding: 12px 16px;
		margin-bottom: 12px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #ffffff;
		transition: all 0.2s;
		min-height: 50px;

		&.is-answer {
			border-color: #10b981;
			background-color: rgba(16, 185, 129, 0.05);

			.option-label {
				background-color: #10b981;
				color: #ffffff;
			}
		}

		&:last-child {
			margin-bottom: 0;
		}
	}

	.option-label {
		width: 28px;
		height: 28px;
		line-height: 28px;
		text-align: center;
		border-radius: 4px;
		background-color: #f5f5f5;
		color: #666;
		font-weight: 600;
		font-size: 14px;
		margin-right: 12px;
		flex-shrink: 0;
		transition: all 0.2s;

		&.is-answer {
			background-color: #10b981;
			color: #ffffff;
		}
	}

	.option-content {
		flex: 1;
		font-size: 15px;
		line-height: 1.6;
		color: #333;
		padding-top: 2px;

		:deep(p) {
			margin: 0;
		}

		:deep(img) {
			max-width: 100%;
			height: auto;
		}
	}

	// 答案区域
	.question-answer-section {
		margin-bottom: 20px;
		padding: 12px 16px;
		background-color: #f9f9f9;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.answer-label {
		font-size: 14px;
		color: #666;
		font-weight: 500;
		flex-shrink: 0;
	}

	.answer-content {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.answer-tag {
		padding: 4px 12px;
		background-color: #1890ff;
		color: #ffffff;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
	}

	// 解析区域
	.question-analysis {
		margin-top: 20px;
		padding: 16px;
		background-color: #f9f9f9;
		border-radius: 8px;
	}

	.analysis-header {
		font-size: 15px;
		font-weight: 600;
		color: #333;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid #e8e8e8;
	}

	.analysis-content {
		font-size: 14px;
		line-height: 1.8;
		color: #666;

		:deep(p) {
			margin: 0 0 8px 0;
			&:last-child {
				margin-bottom: 0;
			}
		}

		:deep(img) {
			max-width: 100%;
			height: auto;
		}
	}
}

.pagination-wrapper {
	flex-shrink: 0;
	padding-top: 16px;
	border-top: 1px solid #e8e8e8;
	display: flex;
	justify-content: center;
}

.error-message,
.success-message {
	margin-top: 8px;
}

.json-input-section {
	.json-textarea {
		padding: 12px;
	}
}

// 弹窗样式优化
:deep(.json-import-modal-wrap) {
	.ant-modal {
		top: 20px;
		padding-bottom: 0;
	}

	.ant-modal-content {
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 40px);
		overflow: hidden;
	}

	.ant-modal-header {
		flex-shrink: 0;
		padding: 16px 24px;
		border-bottom: 1px solid #f0f0f0;
	}

	.ant-modal-body {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		padding: 24px;
	}

	.ant-modal-footer {
		flex-shrink: 0;
		padding: 10px 16px;
		border-top: 1px solid #f0f0f0;
	}
}

// 编辑模式样式
.edit-field {
	margin-bottom: 16px;

	.edit-label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #333;
		font-size: 14px;
	}
}

.options-edit-list {
	.option-edit-item {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;

		.option-edit-label {
			width: 30px;
			flex-shrink: 0;
			font-weight: 500;
			color: #666;
		}
	}
}
</style>
