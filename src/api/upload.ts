import request from '@/utils/request';

/** 分片大小 5MB，单次请求体小于网关限制，避免 413 */
const CHUNK_SIZE = 5 * 1024 * 1024;

function generateUploadId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

/** 上传一个分片 */
async function uploadCourseFileChunk(
	chunk: Blob,
	uploadId: string,
	chunkIndex: number,
	totalChunks: number,
	fileName: string,
): Promise<{ chunkIndex: number; totalChunks: number }> {
	const form = new FormData();
	form.append('chunk', chunk, `chunk-${chunkIndex}`);
	form.append('uploadId', uploadId);
	form.append('chunkIndex', String(chunkIndex));
	form.append('totalChunks', String(totalChunks));
	form.append('fileName', fileName);
	const res = (await request.post('/admin/upload/course-file-chunk', form)) as {
		data?: { chunkIndex: number; totalChunks: number };
	};
	const data = res?.data;
	if (!data) throw new Error(`分片 ${chunkIndex} 上传失败`);
	return data;
}

/** 合并分片并返回最终 fileUrl */
async function mergeCourseFileChunks(
	uploadId: string,
	totalChunks: number,
	fileName: string,
): Promise<{ url: string; fileUrl: string; fileName: string; fileType: string }> {
	const res = (await request.post('/admin/upload/course-file-merge', {
		uploadId,
		totalChunks,
		fileName,
	})) as { data: { url: string; fileUrl: string; fileName: string; fileType: string } };
	const data = res?.data ?? res;
	if (!data?.url && !data?.fileUrl) throw new Error('合并失败：未返回文件地址');
	return {
		url: data.url || data.fileUrl,
		fileUrl: data.fileUrl || data.url,
		fileName: data.fileName || fileName,
		fileType: data.fileType || (fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'doc'),
	};
}

interface UploadResponse {
	code: number;
	msg: string;
	data: {
		url: string;
		imageUrl: string;
	};
}

/**
 * 上传图片到服务器
 * @param file 图片文件
 * @returns 返回图片数据，包含 url 和 imageUrl
 */
export async function uploadImage(file: File): Promise<{ url: string; imageUrl: string }> {
	const formData = new FormData();
	formData.append('file', file);

	try {
		// 注意：对于 FormData，axios 会自动设置正确的 Content-Type（包括 boundary）
		// 手动设置可能会导致 boundary 丢失，所以不设置 Content-Type
		const response = (await request.post('/admin/upload/image', formData)) as UploadResponse;

		// 检查响应格式
		if (response.code !== 200 && response.code !== 0) {
			throw new Error(response.msg || '上传失败');
		}

		// 返回 data 部分，方便使用
		if (!response.data || (!response.data.url && !response.data.imageUrl)) {
			throw new Error('上传失败：未返回图片URL');
		}

		return response.data;
	} catch (error: any) {
		// 统一错误处理
		if (error?.response?.data) {
			const errorData = error.response.data;
			throw new Error(errorData.msg || errorData.message || '上传失败');
		}
		throw error;
	}
}

/** 获取课程文件直传 COS 凭证（绕过云托管 413，前端直传对象存储） */
export async function getCourseFileUploadUrl(fileName: string): Promise<{
	url: string;
	token: string;
	authorization: string;
	cos_file_id: string;
	path: string;
	finalFileUrl: string;
	fileName: string;
	fileType: string;
}> {
	const res = (await request.post('/admin/upload/course-file-upload-url', { fileName })) as {
		data: { url: string; token: string; authorization: string; cos_file_id: string; path: string; finalFileUrl: string; fileName: string; fileType: string };
	};
	const data = res?.data ?? res;
	if (!data?.url || !data?.authorization || !data?.cos_file_id) {
		throw new Error((data as any)?.errmsg || '获取上传凭证失败');
	}
	return {
		url: data.url,
		token: data.token,
		authorization: data.authorization,
		cos_file_id: data.cos_file_id,
		path: data.path,
		finalFileUrl: data.finalFileUrl,
		fileName: data.fileName || fileName,
		fileType: data.fileType || (fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'doc'),
	};
}

/** 直传文件到 COS（浏览器直接 POST 到凭证中的 url，不经过后端，无 413） */
export async function uploadCourseFileToCos(file: File, credentials: {
	url: string;
	token: string;
	authorization: string;
	cos_file_id: string;
	path: string;
}): Promise<void> {
	const form = new FormData();
	form.append('key', credentials.path);
	form.append('Signature', credentials.authorization);
	form.append('x-cos-security-token', credentials.token);
	form.append('x-cos-meta-fileid', credentials.cos_file_id);
	form.append('file', file, file.name);
	const response = await fetch(credentials.url, {
		method: 'POST',
		body: form,
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`直传失败: ${response.status} ${text}`);
	}
}

/** 上传课程文件（PDF/Word）：大文件分片上传，小文件直传 COS 或单次 POST */
export async function uploadCourseFile(file: File): Promise<{ url: string; fileUrl: string; fileName: string; fileType: string }> {
	const name = (file.name || '').trim();
	if (!name || !/\.(pdf|doc|docx)$/i.test(name)) {
		throw new Error('仅支持 PDF、Word（.doc/.docx）文件');
	}

	// 大文件：分片上传，避免 413
	if (file.size > CHUNK_SIZE) {
		const uploadId = generateUploadId();
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		for (let i = 0; i < totalChunks; i++) {
			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);
			await uploadCourseFileChunk(chunk, uploadId, i, totalChunks, name);
		}
		return mergeCourseFileChunks(uploadId, totalChunks, name);
	}

	// 小文件：优先直传 COS，失败时回退单次 POST
	try {
		const credentials = await getCourseFileUploadUrl(name);
		await uploadCourseFileToCos(file, credentials);
		return {
			url: credentials.finalFileUrl,
			fileUrl: credentials.finalFileUrl,
			fileName: credentials.fileName,
			fileType: credentials.fileType,
		};
	} catch (e: any) {
		if (e?.message?.includes('直传失败') || e?.message?.includes('CORS') || e?.message?.includes('凭证')) {
			throw e;
		}
		const formData = new FormData();
		formData.append('file', file);
		const res = (await request.post('/admin/upload/course-file', formData)) as { data: { url: string; fileUrl: string; fileName: string; fileType: string } };
		const data = res?.data ?? res;
		if (!data?.url && !data?.fileUrl) {
			throw new Error('上传失败：未返回文件地址');
		}
		return {
			url: data.url || data.fileUrl,
			fileUrl: data.fileUrl || data.url,
			fileName: data.fileName || file.name,
			fileType: data.fileType || (file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'doc'),
		};
	}
}
