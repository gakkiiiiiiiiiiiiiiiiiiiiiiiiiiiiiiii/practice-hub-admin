import request from '@/utils/request';

// 课程管理（已迁移到 course.ts，保留此接口以兼容旧代码）
export function getSubjectList(params?: any) {
	return request.get('/admin/courses', { params });
}

export function createSubject(data: any) {
	return request.post('/admin/courses', data);
}

export function updateSubject(id: number, data: any) {
	return request.put(`/admin/courses/${id}`, data);
}

export function deleteSubject(id: number) {
	return request.delete(`/admin/courses/${id}`);
}

export function updateSubjectStatus(id: number, data: any) {
	return request.patch(`/admin/courses/${id}/status`, data);
}

// 章节管理（需要根据实际 API 文档调整，可能包含在课程详情中）
export function getChapterList(params: any) {
	// 兼容 courseId 和 course_id 参数
	const newParams = { ...params };
	if (params.subjectId || params.subject_id) {
		newParams.courseId = params.subjectId || params.subject_id;
		delete newParams.subjectId;
		delete newParams.subject_id;
	}
	return request.get('/admin/chapters', { params: newParams });
}

export function createChapter(data: any) {
	return request.post('/admin/chapters', data);
}

export function updateChapter(id: number, data: any) {
	return request.put(`/admin/chapters/${id}`, data);
}

export function deleteChapter(id: number) {
	return request.delete(`/admin/chapters/${id}`);
}

// 批量删除章节
export function batchDeleteChapters(ids: number[]) {
	return request.post('/admin/chapters/batch-delete', { ids });
}

// 批量更新章节状态
export function batchUpdateChapterStatus(ids: number[], status: number) {
	return request.post('/admin/chapters/batch-update-status', { ids, status });
}

// 试题管理
export function getQuestionList(params?: any) {
	return request.get('/admin/questions', { params });
}

export function getQuestionDetail(id: number) {
	return request.get(`/admin/questions/${id}`);
}

export function createQuestion(data: any) {
	return request.post('/admin/questions', data);
}

export function updateQuestion(id: number, data: any) {
	return request.put(`/admin/questions/${id}`, data);
}

export function deleteQuestion(id: number) {
	return request.delete(`/admin/questions/${id}`);
}

export function deleteQuestionsBatch(ids: number[]) {
	return request.post('/admin/questions/batch-delete', { ids });
}

/** 批量更新题目序号（拖拽排序） */
export function batchUpdateQuestionOrder(orders: { id: number; sort_order: number }[]) {
	return request.post('/admin/questions/batch-update-order', { orders });
}

/** 批量启用/禁用题目 */
export function batchUpdateQuestionStatus(ids: number[], status: number) {
	return request.post('/admin/questions/batch-update-status', { ids, status });
}

// 批量导入
export function importQuestions(data: FormData) {
	return request.post('/admin/questions/import', data, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
}

export function downloadQuestionTemplate() {
	return request.get('/admin/questions/template', {
		responseType: 'blob',
	});
}

// JSON 导入题目
export function importQuestionsFromJson(data: { chapterId: number; questions: any[] }) {
	return request.post('/admin/questions/import-json', data);
}

// PDF 提取题目：提交后立即返回 taskId、fileName
// direct=true 时直接上传 PDF 解析（不先写入对象存储）；否则先上传到存储再解析
export function submitPdfExtractTask(file: File, options?: { forceOcr?: boolean; direct?: boolean }) {
	const formData = new FormData();
	formData.append('pdf', file);
	if (options?.forceOcr) {
		formData.append('forceOcr', '1');
	}
	if (options?.direct) {
		formData.append('direct', '1');
	}
	return request.post<{ taskId: string; fileName: string }>('/admin/process-pdf/extract', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		timeout: 180000, // 大文件上传可能较慢，3 分钟
	});
}

// 获取近期 PDF 提取任务列表（用于弹窗表格）
export function getPdfExtractTasks(limit?: number) {
	return request.get<{
		taskId: string;
		status: 'pending' | 'processing' | 'completed' | 'failed';
		fileName?: string;
		progress?: string;
		result?: { count: number; data: any[] };
		error?: string;
		createdAt: number;
	}[]>('/admin/process-pdf/extract/tasks', { params: limit != null ? { limit } : undefined });
}

// 查询 PDF 提取任务状态与结果
export function getPdfExtractTask(taskId: string) {
	return request.get<{
		taskId: string;
		status: 'pending' | 'processing' | 'completed' | 'failed';
		fileName?: string;
		progress?: string;
		result?: { count: number; data: any[] };
		error?: string;
		createdAt: number;
	}>(`/admin/process-pdf/extract/task/${taskId}`);
}

// 提交 PDF 提取任务并轮询直到完成，返回题目列表（供弹窗内使用，避免长时间挂起请求）
export async function extractQuestionsFromPdf(file: File, options?: { forceOcr?: boolean }): Promise<{ data: { data: any[] } }> {
	const submitRes = await submitPdfExtractTask(file, options);
	const body = submitRes.data as { data?: { taskId: string }; taskId?: string };
	const taskId = body?.data?.taskId ?? body?.taskId;
	if (!taskId) {
		throw new Error('提交任务失败，未返回 taskId');
	}
	const pollInterval = 2000;
	const maxWait = 15 * 60 * 1000; // 最多等 15 分钟
	const start = Date.now();
	while (Date.now() - start < maxWait) {
		const taskRes = await getPdfExtractTask(taskId);
		const resBody = taskRes.data as { data?: { status: string; result?: { data: any[] }; error?: string } };
		const task = resBody?.data ?? resBody;
		const status = task?.status;
		if (status === 'completed') {
			const data = task?.result?.data ?? [];
			return { data: { data } };
		}
		if (status === 'failed') {
			throw new Error(task?.error || 'PDF 提取失败');
		}
		await new Promise((r) => setTimeout(r, pollInterval));
	}
	throw new Error('PDF 提取超时，请稍后在历史任务中查看');
}

// Word 提取题目（.docx/.doc），超时 2 分钟
export function extractQuestionsFromWord(file: File) {
	const formData = new FormData();
	formData.append('doc', file);
	return request.post('/admin/process-pdf/extract-doc', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		timeout: 120000, // 2 分钟
	});
}

// 上传图片（已迁移到 @/api/upload，保留此函数以保持向后兼容）
// 建议使用 @/api/upload 中的 uploadImage 函数
export function uploadImage(data: FormData) {
	return request.post('/admin/upload/image', data, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
}
