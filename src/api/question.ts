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

// PDF 提取题目
export function extractQuestionsFromPdf(file: File) {
	const formData = new FormData();
	formData.append('pdf', file);
	return request.post('/admin/process-pdf/extract', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
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
