<template>
	<div class="question-edit">
		<!-- 返回按钮 -->
		<div class="page-header">
			<a-button type="text" @click="handleCancel" class="back-btn">
				<template #icon><arrow-left-outlined /></template>
				返回
			</a-button>
		</div>

		<a-card :bordered="false" class="edit-card">
			<template #title>
				<div class="card-title">
					<span class="title-text">{{ isEdit ? '编辑题目' : '新增题目' }}</span>
					<a-tag v-if="formState.type" color="blue" class="type-tag">
						{{ getTypeName(formState.type) }}
					</a-tag>
					<a-tag v-if="selectedCourseId && selectedChapterId" color="green" class="location-tag">
						{{ getCourseName(selectedCourseId) }} / {{ getChapterName(selectedChapterId) }}
					</a-tag>
				</div>
			</template>

			<a-form
				ref="formRef"
				:model="formState"
				:rules="rules"
				:label-col="{ span: 4 }"
				:wrapper-col="{ span: 20 }"
				class="question-form"
			>
				<!-- 基本信息 -->
				<a-divider orientation="left" class="section-divider">
					<span class="section-title">基本信息</span>
				</a-divider>

				<a-form-item label="课程" name="courseId">
					<a-select
						v-model:value="selectedCourseId"
						placeholder="请选择课程"
						@change="handleCourseChange"
						:loading="!courseList.length"
						show-search
						:filter-option="filterOption"
					>
						<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
							{{ course.name }}
						</a-select-option>
					</a-select>
				</a-form-item>

				<a-form-item label="章节" name="chapter_id">
					<a-select
						v-model:value="selectedChapterId"
						placeholder="请先选择课程"
						:disabled="!selectedCourseId"
						@change="handleChapterChange"
						:loading="selectedCourseId && !chapterList.length"
						show-search
						:filter-option="filterOption"
					>
						<a-select-option v-for="chapter in chapterList" :key="chapter.id" :value="chapter.id">
							{{ chapter.name }}
						</a-select-option>
					</a-select>
					<div v-if="!selectedCourseId" class="form-tip">请先选择课程</div>
				</a-form-item>

				<a-form-item label="题型" name="type">
					<a-radio-group v-model:value="formState.type" button-style="solid" class="type-radio-group">
						<a-radio-button :value="1">
							<span class="type-item">单选题</span>
						</a-radio-button>
						<a-radio-button :value="2">
							<span class="type-item">多选题</span>
						</a-radio-button>
						<a-radio-button :value="3">
							<span class="type-item">判断题</span>
						</a-radio-button>
						<a-radio-button :value="4">
							<span class="type-item">填空题</span>
						</a-radio-button>
						<a-radio-button :value="5">
							<span class="type-item">阅读理解</span>
						</a-radio-button>
						<a-radio-button :value="6">
							<span class="type-item">简答题</span>
						</a-radio-button>
					</a-radio-group>
				</a-form-item>

				<!-- 题目内容 -->
				<a-divider orientation="left" class="section-divider">
					<span class="section-title">题目内容</span>
				</a-divider>

				<a-form-item label="题干" name="stem">
					<div class="editor-wrapper">
						<WangEditor v-model="formState.stem" placeholder="请输入题干内容" />
						<div class="editor-tip-row">
							<div class="editor-tip">支持富文本编辑，可插入图片、公式等；插入图片后可点击「识别题干图片」将图中文字识别并追加到题干</div>
							<a-button
								type="primary"
								ghost
								:loading="stemOcrLoading"
								:disabled="!hasStemImages"
								@click="handleStemImageOcr"
								class="stem-ocr-btn"
							>
								<template #icon><scan-outlined /></template>
								识别题干图片
							</a-button>
						</div>
					</div>
				</a-form-item>

				<a-form-item
					v-if="formState.type !== QuestionType.FILL_BLANK && formState.type !== QuestionType.SHORT_ANSWER"
					label="选项"
				>
					<div class="options-container">
						<div class="options-header">
							<span class="options-count">共 {{ formState.options.length }} 个选项</span>
						</div>
						<a-alert
							v-if="formState.type === QuestionType.JUDGE"
							message="判断题固定为两个选项：正确/错误"
							type="info"
							show-icon
							:closable="false"
							style="margin-bottom: 16px"
						/>
						<!-- 判断题：固定两个选项（正确/错误） -->
						<template v-if="formState.type === QuestionType.JUDGE">
							<div v-for="(option, index) in formState.options" :key="index" class="option-item option-item-disabled">
								<div style="flex: 1">
									<a-input v-model:value="option.text" :placeholder="index === 0 ? '正确' : '错误'" :disabled="true" />
								</div>
							</div>
						</template>
						<!-- 其他题型：可编辑选项 -->
						<template v-else>
							<div v-for="(option, index) in formState.options" :key="index" class="option-item">
								<div class="option-label">
									{{ getOptionLabel(index) }}
								</div>
								<div style="flex: 1">
									<OptionEditor v-model="option.text" />
								</div>
								<a-popconfirm
									title="确定要删除这个选项吗？"
									@confirm="removeOption(index)"
									:disabled="formState.options.length <= 2"
								>
									<a-button type="link" danger :disabled="formState.options.length <= 2" class="option-delete-btn">
										删除
									</a-button>
								</a-popconfirm>
							</div>
							<a-button
								type="dashed"
								block
								@click="addOption"
								class="add-option-btn"
								:disabled="formState.options.length >= 10"
							>
								<template #icon><plus-outlined /></template>
								添加选项
								<span v-if="formState.options.length >= 10" class="option-limit-tip">（最多10个选项）</span>
							</a-button>
						</template>
					</div>
				</a-form-item>

				<a-form-item label="正确答案" name="answer">
					<!-- 填空题：支持多个答案输入 -->
					<div v-if="formState.type === QuestionType.FILL_BLANK" class="fill-blank-answers">
						<div v-for="(answer, index) in fillBlankAnswers" :key="index" class="fill-blank-item">
							<a-input
								v-model:value="fillBlankAnswers[index]"
								:placeholder="`请输入第${index + 1}个答案`"
								class="answer-input"
								@change="handleFillBlankAnswerChange"
							/>
							<a-button
								v-if="fillBlankAnswers.length > 1"
								type="text"
								danger
								@click="removeFillBlankAnswer(index)"
								class="remove-btn"
							>
								<template #icon><delete-outlined /></template>
							</a-button>
						</div>
						<a-button type="dashed" @click="addFillBlankAnswer" class="add-answer-btn">
							<template #icon><plus-outlined /></template>
							添加答案
						</a-button>
						<div class="form-tip">填空题支持多个答案，用户只需填写所有正确答案即可</div>
					</div>
					<!-- 单选题：单选框 -->
					<a-radio-group
						v-else-if="formState.type === QuestionType.SINGLE_CHOICE"
						v-model:value="answerInput"
						@change="handleAnswerChange"
						class="answer-radio-group"
					>
						<a-radio
							v-for="(option, index) in formState.options"
							:key="index"
							:value="getOptionLabel(index)"
							class="answer-radio"
						>
							<span class="answer-label">{{ getOptionLabel(index) }}</span>
						</a-radio>
					</a-radio-group>
					<!-- 判断题：单选框（只显示正确/错误，不显示A/B） -->
					<a-radio-group
						v-else-if="formState.type === QuestionType.JUDGE"
						v-model:value="answerInput"
						@change="handleAnswerChange"
						class="answer-radio-group"
					>
						<a-radio
							v-for="(option, index) in formState.options"
							:key="index"
							:value="getOptionLabel(index)"
							class="answer-radio"
						>
							<span class="answer-label">{{ option.text || (index === 0 ? '正确' : '错误') }}</span>
						</a-radio>
					</a-radio-group>
					<!-- 多选题：多选框 -->
					<a-checkbox-group
						v-else-if="formState.type === QuestionType.MULTIPLE_CHOICE"
						v-model:value="answerArray"
						@change="handleAnswerArrayChange"
						class="answer-checkbox-group"
					>
						<a-checkbox
							v-for="(option, index) in formState.options"
							:key="index"
							:value="getOptionLabel(index)"
							class="answer-checkbox"
						>
							<span class="answer-label">{{ getOptionLabel(index) }}</span>
						</a-checkbox>
					</a-checkbox-group>
					<!-- 简答题：支持文本和图片参考答案 -->
					<div v-else-if="formState.type === QuestionType.SHORT_ANSWER" class="short-answer-answers">
						<a-tabs default-active-key="text">
							<a-tab-pane key="text" tab="文本答案">
								<a-textarea
									v-model:value="shortAnswerText"
									placeholder="请输入参考答案（文本）"
									:rows="6"
									@change="handleShortAnswerTextChange"
									class="answer-textarea"
								/>
							</a-tab-pane>
							<a-tab-pane key="image" tab="图片答案">
								<div class="image-answer-upload">
									<a-upload
										v-model:file-list="shortAnswerImageList"
										list-type="picture-card"
										:max-count="1"
										:before-upload="beforeUpload"
										@preview="handlePreview"
										@remove="handleRemove"
										:custom-request="handleImageUpload"
									>
										<div v-if="shortAnswerImageList.length < 1">
											<plus-outlined />
											<div style="margin-top: 8px">上传图片</div>
										</div>
									</a-upload>
								</div>
								<div class="form-tip">简答题参考答案可以是文本或图片，二选一即可</div>
							</a-tab-pane>
						</a-tabs>
					</div>
					<!-- 阅读理解：文本输入（暂时） -->
					<a-input
						v-else
						v-model:value="answerInput"
						placeholder="请输入正确答案（如：A 或 A,B）"
						@change="handleAnswerChange"
						class="answer-input"
					/>
					<div v-if="formState.type === QuestionType.MULTIPLE_CHOICE" class="form-tip">多选题可以选择多个答案</div>
				</a-form-item>

				<!-- 解析说明 -->
				<a-divider orientation="left" class="section-divider">
					<span class="section-title">解析说明</span>
				</a-divider>

				<a-form-item label="解析" name="analysis">
					<div class="editor-wrapper">
						<WangEditor v-model="formState.analysis" placeholder="请输入解析内容（可选）" />
						<div class="editor-tip">详细解析有助于学生理解题目</div>
					</div>
				</a-form-item>

				<a-form-item label="AI解析" name="aiAnalysis">
					<a-textarea
						v-model:value="formState.aiAnalysis"
						:rows="4"
						placeholder="AI生成的解析内容（预留字段）"
						:disabled="true"
						class="ai-analysis-input"
					/>
					<div class="form-tip">此字段由AI自动生成，暂不支持手动编辑</div>
				</a-form-item>
			</a-form>

			<a-divider />

			<div class="footer-toolbar">
				<a-space size="large">
					<a-button size="large" @click="handleCancel">取消</a-button>
					<a-button type="primary" size="large" :loading="loading" @click="handleSubmit">
						<template #icon v-if="!loading">
							<check-outlined />
						</template>
						{{ loading ? '保存中...' : '保存' }}
					</a-button>
				</a-space>
			</div>
		</a-card>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { PlusOutlined, CheckOutlined, ArrowLeftOutlined, DeleteOutlined, ScanOutlined } from '@ant-design/icons-vue';
import WangEditor from '@/components/WangEditor/index.vue';
import OptionEditor from '@/components/OptionEditor/index.vue';
import { getQuestionDetail, createQuestion, updateQuestion, getChapterList } from '@/api/question';
import { getCourseList } from '@/api/course';
import { uploadImage } from '@/api/upload';
import { ocrImage } from '@/api/process-pdf';

const router = useRouter();
const route = useRoute();

// 题型常量
const QuestionType = {
	SINGLE_CHOICE: 1, // 单选题
	MULTIPLE_CHOICE: 2, // 多选题
	JUDGE: 3, // 判断题
	FILL_BLANK: 4, // 填空题
	READING_COMPREHENSION: 5, // 阅读理解
	SHORT_ANSWER: 6, // 简答题
} as const;

const formRef = ref();
const loading = ref(false);
const courseList = ref([]);
const chapterList = ref([]);

const questionId = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!questionId.value);

// ==================== 题型判断辅助函数 ====================

/**
 * 判断题型是否需要选项
 */
const needsOptions = (type: number): boolean => {
	return type !== QuestionType.FILL_BLANK && type !== QuestionType.SHORT_ANSWER;
};

/**
 * 判断题型是否需要验证答案范围
 */
const needsAnswerValidation = (type: number): boolean => {
	return type !== QuestionType.FILL_BLANK && type !== QuestionType.SHORT_ANSWER;
};

/**
 * 判断题型是否需要将答案转换为大写
 */
const needsUpperCaseAnswer = (type: number): boolean => {
	return type !== QuestionType.FILL_BLANK && type !== QuestionType.SHORT_ANSWER;
};

const formState = ref({
	chapter_id: undefined,
	type: 1, // 1=单选, 2=多选, 3=判断, 4=填空, 5=阅读理解
	stem: '',
	options: [
		{ label: 'A', text: '' },
		{ label: 'B', text: '' },
	],
	answer: [] as string[],
	analysis: '',
});

// 初始化选项（根据题型）
const initOptions = () => {
	const { type } = formState.value;

	if (type === QuestionType.JUDGE) {
		// 判断题：固定为"正确"和"错误"
		formState.value.options = [
			{ label: 'A', text: '正确' },
			{ label: 'B', text: '错误' },
		];
	} else if (!needsOptions(type)) {
		// 填空题和简答题不需要选项
		formState.value.options = [];
	} else {
		// 其他题型：至少两个选项
		if (formState.value.options.length < 2) {
			formState.value.options = [
				{ label: 'A', text: '' },
				{ label: 'B', text: '' },
			];
		}
	}
};

// 用于显示和编辑答案的输入框（字符串格式）
const answerInput = ref('');
// 多选题的答案数组
const answerArray = ref<string[]>([]);
// 填空题的答案数组（支持多个答案）
const fillBlankAnswers = ref<string[]>(['']);
// 简答题文本答案
const shortAnswerText = ref('');
// 简答题图片答案列表
const shortAnswerImageList = ref<any[]>([]);
// 题干图片 OCR 识别中
const stemOcrLoading = ref(false);
// 保存待回显的答案数据
const pendingAnswerData = ref<string[]>([]);

/** 题干 HTML 中是否包含图片（用于控制「识别题干图片」按钮可用） */
const hasStemImages = computed(() => {
	const html = formState.value.stem || '';
	return /<img[^>]+src=/i.test(html);
});

// 课程和章节ID（用于前端选择，提交时需要转换为 chapter_id）
const selectedCourseId = ref<number | undefined>(undefined);
const selectedChapterId = ref<number | undefined>(undefined);

const rules = {
	chapter_id: [{ required: true, message: '请选择章节', trigger: 'change' }],
	type: [{ required: true, message: '请选择题型', trigger: 'change' }],
	stem: [{ required: true, message: '请输入题干', trigger: 'blur' }],
	answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }],
};

const fetchCourses = async () => {
	try {
		const res = await getCourseList();
		// 后端返回的是数组，不是分页对象
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

const fetchChapters = async (courseId: number) => {
	try {
		const res = await getChapterList({
			courseId,
		});
		// 后端返回的是数组，不是分页对象
		chapterList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取章节列表失败:', error);
		chapterList.value = [];
	}
};

const fetchQuestionDetail = async () => {
	if (!questionId.value) return;

	try {
		const res = await getQuestionDetail(Number(questionId.value));
		const data = res.data;

		console.log('题目详情数据:', data);

		// 先设置题型，这样后续的选项处理才能正确
		if (data.type) {
			formState.value.type = data.type;
		}

		// 后端返回的字段结构：
		// - id, chapter_id, parent_id, type, stem, answer, analysis, difficulty
		// - options: [{label: string, text: string}] (已格式化)
		// - chapter: {id, name}
		// - course: {id, name} (直接在 result 下，不在 chapter 下)

		// 处理章节和课程信息
		if (data.chapter_id) {
			formState.value.chapter_id = data.chapter_id;
			selectedChapterId.value = data.chapter_id;

			// 从 course 字段获取课程ID（新接口结构）
			const courseId = data.course?.id;
			if (courseId) {
				selectedCourseId.value = courseId;
				// 先加载章节列表，确保下拉框有数据
				await fetchChapters(courseId);
			}
		}

		// 处理选项数据，确保标签按A、B、C、D顺序
		// 后端已经返回格式化的 options: [{label: string, text: string}]
		let options: any[] = [];
		if (data.type === 3) {
			// 判断题：固定为"正确"和"错误"
			options = [
				{ label: 'A', text: '正确' },
				{ label: 'B', text: '错误' },
			];
		} else if (needsOptions(data.type) && data.options && Array.isArray(data.options) && data.options.length > 0) {
			// 后端返回的选项已经是正确格式，但需要确保标签按A、B、C、D顺序重新生成
			options = data.options.map((opt: any, index: number) => ({
				label: getOptionLabel(index),
				text: opt.text || opt.content || '',
			}));
		} else if (needsOptions(data.type)) {
			// 如果没有选项且需要选项的题型，创建默认的两个选项
			options = [
				{ label: 'A', text: '' },
				{ label: 'B', text: '' },
			];
		} else {
			// 填空题和简答题不需要选项
			options = [];
		}

		// 处理答案数据
		let answerData: string[] = [];
		const shouldUpperCase = needsUpperCaseAnswer(data.type);

		if (Array.isArray(data.answer)) {
			answerData = data.answer.map((a: any) => {
				const trimmed = String(a).trim();
				return shouldUpperCase ? trimmed.toUpperCase() : trimmed;
			});
		} else if (data.answer) {
			// 如果是字符串，尝试解析
			if (typeof data.answer === 'string') {
				answerData = data.answer
					.split(',')
					.map((a: string) => {
						const trimmed = a.trim();
						return shouldUpperCase ? trimmed.toUpperCase() : trimmed;
					})
					.filter((a: string) => a);
			} else {
				const trimmed = String(data.answer).trim();
				answerData = [shouldUpperCase ? trimmed.toUpperCase() : trimmed];
			}
		}

		console.log('原始答案数据:', data.answer);
		console.log('处理后的答案数据:', answerData);
		console.log('选项数据:', options);

		// 更新表单状态（使用 Object.assign 确保响应式更新）
		Object.assign(formState.value, {
			chapter_id: data.chapter_id,
			type: data.type,
			stem: data.stem || '',
			options: options,
			answer: answerData,
			analysis: data.analysis || '',
		});

		// 保存待回显的答案数据
		pendingAnswerData.value = [...answerData];

		// 设置答案的函数
		const setAnswerValue = () => {
			if (pendingAnswerData.value.length === 0) return;

			// 填空题不需要等待选项，直接设置答案
			if (formState.value.type === QuestionType.FILL_BLANK) {
				// 填空题：设置答案数组
				if (pendingAnswerData.value.length > 0) {
					fillBlankAnswers.value = [...pendingAnswerData.value];
				} else {
					fillBlankAnswers.value = [''];
				}
				answerInput.value = pendingAnswerData.value.join(',') || '';
				pendingAnswerData.value = []; // 清空待回显数据
				console.log('填空题答案已设置:', fillBlankAnswers.value);
				return;
			}

			// 简答题不需要等待选项，直接设置答案
			if (formState.value.type === QuestionType.SHORT_ANSWER) {
				if (pendingAnswerData.value.length > 0) {
					const answer = pendingAnswerData.value[0];
					// 判断是文本还是图片URL
					if (isImageUrl(answer)) {
						setShortAnswerImage(answer);
					} else {
						setShortAnswerText(answer || '');
					}
				} else {
					clearShortAnswer();
				}
				answerInput.value = pendingAnswerData.value.join(',') || '';
				pendingAnswerData.value = []; // 清空待回显数据
				console.log('简答题答案已设置:', { text: shortAnswerText.value, image: shortAnswerImageList.value });
				return;
			}

			// 其他题型需要等待选项渲染完成
			if (formState.value.options.length === 0) {
				console.log('选项还未加载，等待...');
				return;
			}

			// 获取有效的选项标签
			const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
			console.log('有效选项标签:', validLabels);
			console.log('待回显答案数据:', pendingAnswerData.value);

			// 根据题型设置答案显示
			if (formState.value.type === QuestionType.MULTIPLE_CHOICE) {
				// 多选题：使用数组
				// 确保答案值在选项标签范围内，并转换为大写
				const validAnswers = pendingAnswerData.value
					.map((ans: string) => String(ans).trim().toUpperCase())
					.filter((ans: string) => validLabels.includes(ans));
				console.log('多选题有效答案:', validAnswers);
				if (validAnswers.length > 0) {
					answerArray.value = [...validAnswers]; // 创建新数组确保响应式
					answerInput.value = validAnswers.join(',');
					pendingAnswerData.value = []; // 清空待回显数据
				}
			} else {
				// 单选题、判断题：显示第一个答案
				// 确保答案值在选项标签范围内，并转换为大写
				const firstAnswer = pendingAnswerData.value[0] ? String(pendingAnswerData.value[0]).trim().toUpperCase() : '';
				console.log('单选题/判断题答案:', firstAnswer);
				console.log('是否在有效标签中:', validLabels.includes(firstAnswer));
				if (validLabels.includes(firstAnswer)) {
					answerInput.value = firstAnswer;
					pendingAnswerData.value = []; // 清空待回显数据
				}
			}

			console.log('最终答案输入值:', answerInput.value);
			console.log('最终答案数组值:', answerArray.value);
		};

		// 填空题直接设置答案，不需要等待选项渲染
		if (formState.value.type === QuestionType.FILL_BLANK) {
			setAnswerValue();
		} else {
			// 其他题型需要等待选项渲染完成
			await nextTick();
			setAnswerValue();

			// 再等待一次，确保选项完全渲染（如果第一次设置失败）
			await nextTick();
			setAnswerValue();
		}
	} catch (error) {
		console.error('获取题目详情失败:', error);
		message.error('获取题目详情失败');
	}
};

const handleCourseChange = async (courseId: number) => {
	selectedChapterId.value = undefined;
	formState.value.chapter_id = undefined;
	if (courseId) {
		await fetchChapters(courseId);
	}
};

const handleChapterChange = (chapterId: number) => {
	formState.value.chapter_id = chapterId;
};

const handleAnswerChange = (e: any) => {
	let value = '';
	if (e && e.target) {
		// 输入框的 change 事件
		value = e.target.value || '';
	} else {
		// 单选框的 change 事件，直接是值
		value = e || '';
	}

	// 将字符串转换为数组
	if (formState.value.type === QuestionType.FILL_BLANK) {
		// 填空题：使用答案数组（过滤空值）
		formState.value.answer = fillBlankAnswers.value.filter((ans) => ans && ans.trim() !== '');
	} else {
		// 单选题、判断题：单个答案
		formState.value.answer = value ? [value] : [];
	}
};

// 填空题答案变化处理
const handleFillBlankAnswerChange = () => {
	// 过滤空值后更新答案
	formState.value.answer = fillBlankAnswers.value.filter((ans) => ans && ans.trim() !== '');
	// 同步到 answerInput（用于显示）
	answerInput.value = formState.value.answer.join(',');
};

// 添加填空题答案
const addFillBlankAnswer = () => {
	fillBlankAnswers.value.push('');
};

// 删除填空题答案
const removeFillBlankAnswer = (index: number) => {
	if (fillBlankAnswers.value.length > 1) {
		fillBlankAnswers.value.splice(index, 1);
		handleFillBlankAnswerChange();
	}
};

// 多选题答案变化处理
const handleAnswerArrayChange = (values: string[]) => {
	answerArray.value = values;
	formState.value.answer = values;
	// 同步到 answerInput（用于显示）
	answerInput.value = values.join(',');
};

// 获取题型名称
// ==================== 简答题答案处理辅助函数 ====================

/**
 * 判断字符串是否为图片URL
 */
const isImageUrl = (url: string): boolean => {
	if (!url) return false;
	return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * 从上传响应中提取图片URL
 */
const getImageUrlFromResponse = (response: { url?: string; imageUrl?: string }): string | null => {
	return response.url || response.imageUrl || null;
};

/**
 * 创建上传文件列表项
 */
const createUploadFileItem = (file: any, url: string) => {
	return {
		uid: file.uid || Date.now().toString(),
		name: file.name || 'answer-image.jpg',
		status: 'done' as const,
		url,
	};
};

/**
 * 设置简答题图片答案
 */
const setShortAnswerImage = (imageUrl: string, file?: any) => {
	shortAnswerImageList.value = [createUploadFileItem(file || {}, imageUrl)];
	formState.value.answer = [imageUrl];
	shortAnswerText.value = ''; // 清空文本答案
};

/**
 * 设置简答题文本答案
 */
const setShortAnswerText = (text: string) => {
	shortAnswerText.value = text;
	formState.value.answer = text ? [text] : [];
	shortAnswerImageList.value = []; // 清空图片答案
};

/**
 * 清空简答题答案
 */
const clearShortAnswer = () => {
	shortAnswerText.value = '';
	shortAnswerImageList.value = [];
	formState.value.answer = [];
};

/**
 * 检查是否有简答题答案（文本或图片）
 */
const hasShortAnswer = (): boolean => {
	return !!shortAnswerText.value || shortAnswerImageList.value.length > 0;
};

/**
 * 简答题文本答案变化处理
 */
const handleShortAnswerTextChange = () => {
	if (formState.value.type === QuestionType.SHORT_ANSWER) {
		setShortAnswerText(shortAnswerText.value);
	}
};

// 图片上传前处理
const beforeUpload = (file: any) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件！');
		return false;
	}
	const isLt5M = file.size / 1024 / 1024 < 5;
	if (!isLt5M) {
		message.error('图片大小不能超过 5MB！');
		return false;
	}
	return false; // 阻止自动上传，使用自定义上传
};

/**
 * 简答题图片上传处理
 */
const handleImageUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;
	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await uploadImage(file);
		const imageUrl = getImageUrlFromResponse(response);

		if (imageUrl) {
			setShortAnswerImage(imageUrl, file);
			onSuccess?.('ok');
			message.success('图片上传成功');
		} else {
			throw new Error('上传失败：未返回图片URL');
		}
	} catch (error: any) {
		console.error('图片上传失败:', error);
		message.error(error?.message || '图片上传失败');
		clearShortAnswer();
		onError?.(error);
	}
};

// 预览图片
const handlePreview = (file: any) => {
	// 可以在这里实现图片预览功能
	window.open(file.url || file.thumbUrl);
};

/**
 * 删除简答题图片
 */
const handleRemove = () => {
	clearShortAnswer();
};

/** 从题干 HTML 中解析出所有 img 标签（完整标签与 src） */
function parseStemImages(html: string): { fullTag: string; src: string }[] {
	const list: { fullTag: string; src: string }[] = [];
	const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
	let m: RegExpExecArray | null;
	while ((m = regex.exec(html)) !== null) {
		list.push({ fullTag: m[0], src: m[1] });
	}
	return list;
}

/** 将 URL 转为可下载的 File（同源或支持 CORS 的图片） */
async function fetchImageAsFile(url: string, index: number): Promise<File | null> {
	try {
		const res = await fetch(url, { mode: 'cors' });
		if (!res.ok) return null;
		const blob = await res.blob();
		const ext = blob.type?.split('/')[1] || 'png';
		return new File([blob], `stem-img-${index}.${ext}`, { type: blob.type });
	} catch {
		return null;
	}
}

/** 转义 HTML 防止 XSS，用于插入 OCR 文本 */
function escapeHtml(s: string): string {
	const div = document.createElement('div');
	div.textContent = s;
	return div.innerHTML;
}

/** 识别题干中所有图片并追加识别文字到题干 */
const handleStemImageOcr = async () => {
	const html = formState.value.stem || '';
	const images = parseStemImages(html);
	if (images.length === 0) {
		message.warning('题干中暂无图片，请先插入图片后再识别');
		return;
	}

	stemOcrLoading.value = true;
	try {
		let newHtml = html;
		for (let i = 0; i < images.length; i++) {
			const { fullTag, src } = images[i];
			const file = await fetchImageAsFile(src, i);
			if (!file) {
				message.warning(`第 ${i + 1} 张图片无法获取（可能为外链，请先上传到本系统）`);
				continue;
			}
			const { text } = await ocrImage(file);
			if (!text.trim()) continue;
			const insertBlock = `<p class="ocr-result">识别的文字：${escapeHtml(text.trim())}</p>`;
			newHtml = newHtml.replace(fullTag, fullTag + insertBlock);
		}
		formState.value.stem = newHtml;
		message.success('题干图片识别完成，已追加到题干中');
	} catch (err: any) {
		message.error(err?.message || '题干图片识别失败');
	} finally {
		stemOcrLoading.value = false;
	}
};

const getTypeName = (type: number): string => {
	const typeMap: Record<number, string> = {
		1: '单选题',
		2: '多选题',
		3: '判断题',
		4: '填空题',
		5: '阅读理解',
		6: '简答题',
	};
	return typeMap[type] || '未知';
};

// 获取课程名称
const getCourseName = (courseId: number): string => {
	const course = courseList.value.find((c: any) => c.id === courseId);
	return course?.name || '';
};

// 获取章节名称
const getChapterName = (chapterId: number): string => {
	const chapter = chapterList.value.find((c: any) => c.id === chapterId);
	return chapter?.name || '';
};

// 搜索过滤函数
const filterOption = (input: string, option: any) => {
	return option.children[0].children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 获取选项标签（A、B、C、D...）
const getOptionLabel = (index: number): string => {
	const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
	return labels[index] || String.fromCharCode(65 + index); // 如果超过J，使用ASCII码继续
};

// 重新生成所有选项的标签（确保按A、B、C、D顺序）
const regenerateOptionLabels = () => {
	formState.value.options.forEach((option: any, index: number) => {
		option.label = getOptionLabel(index);
	});
};

const addOption = () => {
	// 判断题不允许添加选项
	if (formState.value.type === 3) {
		return;
	}

	const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
	if (formState.value.options.length < labels.length) {
		const nextLabel = labels[formState.value.options.length];
		formState.value.options.push({ label: nextLabel, text: '' });
	} else {
		// 如果超过J，使用ASCII码继续生成
		const nextLabel = String.fromCharCode(65 + formState.value.options.length);
		formState.value.options.push({ label: nextLabel, text: '' });
	}
};

const removeOption = (index: number) => {
	// 判断题不允许删除选项
	if (formState.value.type === 3) {
		return;
	}

	formState.value.options.splice(index, 1);
	// 删除后重新生成标签，确保顺序正确
	regenerateOptionLabels();
};

const handleCancel = () => {
	router.back();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();

		// 手动验证选项
		if (needsOptions(formState.value.type)) {
			if (!formState.value.options || formState.value.options.length < 2) {
				message.error('至少需要2个选项');
				return;
			}
			// 检查选项内容是否为空
			const hasEmptyOption = formState.value.options.some((opt: any) => !opt.text || opt.text.trim() === '');
			if (hasEmptyOption) {
				message.error('选项内容不能为空');
				return;
			}
		}

		// 验证答案
		if (formState.value.type === QuestionType.SHORT_ANSWER) {
			// 简答题：至少要有文本答案或图片答案
			if (!hasShortAnswer()) {
				message.error('简答题至少需要文本答案或图片答案');
				return;
			}
		} else if (!formState.value.answer || formState.value.answer.length === 0) {
			message.error('请选择正确答案');
			return;
		}

		// 验证答案是否在选项范围内
		if (needsAnswerValidation(formState.value.type)) {
			const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
			const invalidAnswers = formState.value.answer.filter((ans: string) => !validLabels.includes(ans));
			if (invalidAnswers.length > 0) {
				message.error(`答案 ${invalidAnswers.join(',')} 不在选项范围内`);
				return;
			}
		}

		loading.value = true;

		// 构建符合后端 DTO 的数据
		const data: any = {
			chapter_id: formState.value.chapter_id,
			type: formState.value.type,
			stem: formState.value.stem,
			answer: formState.value.answer,
		};

		// 选项：填空题和简答题不需要选项
		if (needsOptions(formState.value.type)) {
			// 确保标签是按A、B、C、D顺序生成的
			regenerateOptionLabels();
			// 将选项中的 content 字段转换为 text 字段
			data.options = formState.value.options.map((opt: any) => ({
				label: opt.label,
				text: opt.text || opt.content || '',
			}));
		}

		// 解析（可选）
		if (formState.value.analysis) {
			data.analysis = formState.value.analysis;
		}

		if (isEdit.value) {
			await updateQuestion(Number(questionId.value), data);
			message.success('更新成功');
		} else {
			await createQuestion(data);
			message.success('创建成功');
		}

		router.push('/question/list');
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error(error?.message || '操作失败');
	} finally {
		loading.value = false;
	}
};

// 监听选项变化，如果有待回显的答案，则设置答案
watch(
	() => formState.value.options,
	() => {
		if (pendingAnswerData.value.length > 0) {
			nextTick(() => {
				const { type } = formState.value;

				if (type === QuestionType.MULTIPLE_CHOICE) {
					// 多选题：需要转换为大写
					const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
					const validAnswers = pendingAnswerData.value
						.map((ans: string) => String(ans).trim().toUpperCase())
						.filter((ans: string) => validLabels.includes(ans));
					if (validAnswers.length > 0) {
						answerArray.value = [...validAnswers];
						answerInput.value = validAnswers.join(',');
						pendingAnswerData.value = [];
					}
				} else if (type === QuestionType.FILL_BLANK) {
					// 填空题：不需要转换为大写，保持原样
					answerInput.value = pendingAnswerData.value.join(',') || '';
					pendingAnswerData.value = [];
				} else if (formState.value.options.length > 0) {
					// 单选题、判断题：需要转换为大写
					const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
					const firstAnswer = pendingAnswerData.value[0] ? String(pendingAnswerData.value[0]).trim().toUpperCase() : '';
					if (validLabels.includes(firstAnswer)) {
						answerInput.value = firstAnswer;
						pendingAnswerData.value = [];
					}
				}
			});
		}
	},
	{ deep: true }
);

// 监听题型变化，重置答案
watch(
	() => formState.value.type,
	(newType) => {
		// 切换题型时，清空答案
		formState.value.answer = [];
		answerInput.value = '';
		answerArray.value = [];
		fillBlankAnswers.value = [''];
		pendingAnswerData.value = [];

		// 如果是填空题或简答题，不需要选项
		if (!needsOptions(newType)) {
			if (newType === QuestionType.SHORT_ANSWER) {
				// 简答题：重置答案
				clearShortAnswer();
			}
		} else if (newType === QuestionType.JUDGE) {
			// 判断题：固定两个选项（正确/错误）
			formState.value.options = [
				{ label: 'A', text: '正确' },
				{ label: 'B', text: '错误' },
			];
		} else if (newType === QuestionType.SINGLE_CHOICE || newType === QuestionType.MULTIPLE_CHOICE) {
			// 单选题、多选题：确保至少有两个选项
			if (formState.value.options.length < 2) {
				formState.value.options = [
					{ label: 'A', text: '' },
					{ label: 'B', text: '' },
				];
			}
		}
	}
);

onMounted(async () => {
	await fetchCourses();
	// 初始化选项
	initOptions();
	if (isEdit.value) {
		await fetchQuestionDetail();
	}
});
</script>

<style scoped lang="scss">
.question-edit {
	padding: 24px;
	background: #f5f5f5;
	min-height: calc(100vh - 64px);

	.page-header {
		margin-bottom: 16px;

		.back-btn {
			padding: 0;
			height: auto;
			font-size: 14px;
			color: #1890ff;
			display: inline-flex;
			align-items: center;
			gap: 4px;
			transition: all 0.3s;

			&:hover {
				color: #40a9ff;
				transform: translateX(-2px);
			}
		}
	}

	.edit-card {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		overflow: hidden;

		:deep(.ant-card-head) {
			border-bottom: 1px solid #f0f0f0;
			padding: 16px 24px;
		}

		:deep(.ant-card-body) {
			padding: 24px;
		}
	}

	.card-title {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;

		.title-text {
			font-size: 18px;
			font-weight: 600;
			color: #262626;
		}

		.type-tag {
			font-size: 13px;
		}

		.location-tag {
			font-size: 12px;
			margin-left: 8px;
		}
	}

	.section-divider {
		margin: 32px 0 24px;
		border-color: #e8e8e8;

		.section-title {
			font-size: 14px;
			font-weight: 600;
			color: #595959;
			padding: 0 8px;
		}
	}

	.question-form {
		:deep(.ant-form-item) {
			margin-bottom: 24px;
		}

		:deep(.ant-form-item-label) {
			font-weight: 500;
		}
	}

	.type-radio-group {
		width: 100%;

		:deep(.ant-radio-button-wrapper) {
			flex: 1;
			text-align: center;
			border-radius: 4px;
			margin-right: 8px;
			transition: all 0.3s;

			&:last-child {
				margin-right: 0;
			}

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			}
		}

		.type-item {
			display: inline-block;
			padding: 4px 0;
		}
	}

	.form-tip {
		margin-top: 8px;
		font-size: 12px;
		color: #999;
	}

	.options-container {
		width: 100%;
		background: #fafafa;
		padding: 16px;
		border-radius: 6px;
		border: 1px solid #e8e8e8;

		.options-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;
			padding-bottom: 12px;
			border-bottom: 1px solid #e8e8e8;

			.options-count {
				font-size: 13px;
				color: #8c8c8c;
				font-weight: 500;
			}
		}
	}

	.option-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 16px;
		padding: 12px;
		background: #fff;
		border-radius: 6px;
		border: 1px solid #e8e8e8;
		transition: all 0.3s;

		&:hover {
			border-color: #1890ff;
			box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
		}

		&:last-child {
			margin-bottom: 0;
		}

		&.option-item-disabled {
			background: #f5f5f5;
			border-color: #d9d9d9;

			&:hover {
				border-color: #d9d9d9;
				box-shadow: none;
			}
		}

		.option-label {
			width: 48px;
			height: 48px;
			line-height: 48px;
			text-align: center;
			font-weight: 600;
			font-size: 16px;
			color: #1890ff;
			background: #e6f7ff;
			border-radius: 6px;
			margin-right: 16px;
			flex-shrink: 0;
			border: 2px solid #91d5ff;
		}

		.option-delete-btn {
			margin-left: 12px;
			flex-shrink: 0;
		}
	}

	.add-option-btn {
		margin-top: 16px;
		height: 40px;
		border-style: dashed;
		border-color: #1890ff;
		color: #1890ff;
		transition: all 0.3s;

		&:hover {
			border-color: #40a9ff;
			color: #40a9ff;
			transform: translateY(-2px);
			box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
		}

		&:disabled {
			border-color: #d9d9d9;
			color: #bfbfbf;
		}

		.option-limit-tip {
			margin-left: 8px;
			font-size: 12px;
			color: #999;
		}
	}

	.answer-radio-group,
	.answer-checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		padding: 16px;
		background: #fafafa;
		border-radius: 6px;
		border: 1px solid #e8e8e8;
	}

	.answer-radio,
	.answer-checkbox {
		margin: 0 !important;
		padding: 8px 16px;
		background: #fff;
		border-radius: 6px;
		border: 2px solid #e8e8e8;
		transition: all 0.3s;

		&:hover {
			border-color: #1890ff;
			transform: translateY(-2px);
			box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
		}

		&.ant-radio-checked,
		&.ant-checkbox-checked {
			border-color: #1890ff;
			background: #e6f7ff;
		}

		.answer-label {
			font-weight: 600;
			font-size: 16px;
			color: #1890ff;
		}
	}

	.answer-input {
		width: 100%;
	}

	.editor-wrapper {
		width: 100%;

		.editor-tip-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			margin-top: 8px;
			flex-wrap: wrap;
		}

		.editor-tip {
			flex: 1;
			min-width: 0;
			font-size: 12px;
			color: #8c8c8c;
			display: flex;
			align-items: center;
			gap: 4px;

			&::before {
				content: '💡';
				font-size: 14px;
			}
		}

		.stem-ocr-btn {
			flex-shrink: 0;
		}
	}

	.ai-analysis-input {
		background: #f5f5f5;
	}

	.fill-blank-answers {
		width: 100%;

		.fill-blank-item {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;

			.answer-input {
				flex: 1;
			}

			.remove-btn {
				flex-shrink: 0;
			}
		}

		.add-answer-btn {
			margin-top: 8px;
		}
	}

	.short-answer-answers {
		width: 100%;

		.answer-textarea {
			width: 100%;
		}

		.image-answer-upload {
			margin-top: 16px;
		}
	}

	:deep(.ant-upload-select-picture-card) {
		width: 128px;
		height: 128px;
	}

	.footer-toolbar {
		display: flex;
		justify-content: flex-end;
		padding: 24px 0 0;
		border-top: 1px solid #f0f0f0;
		margin-top: 24px;
	}
}

// 响应式设计
@media (max-width: 768px) {
	.question-edit {
		padding: 16px;

		.question-form {
			:deep(.ant-form-item-label) {
				padding-bottom: 8px;
			}
		}

		.type-radio-group {
			:deep(.ant-radio-button-wrapper) {
				font-size: 12px;
				padding: 4px 8px;
			}
		}

		.option-item {
			flex-direction: column;
			align-items: stretch;

			.option-label {
				width: 100%;
				height: 36px;
				line-height: 36px;
				margin-right: 0;
				margin-bottom: 12px;
			}
		}
	}
}
</style>
