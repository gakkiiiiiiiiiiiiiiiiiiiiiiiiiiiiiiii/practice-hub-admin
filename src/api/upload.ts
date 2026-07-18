import request from '@/utils/request';

/** 分片大小 5MB，单次请求体小于网关限制，避免 413 */
const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CHUNK_RETRY = 3;

export interface UploadCourseFileOptions {
	onProgress?: (percent: number, stage?: string) => void;
}

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
	const res = (await request.post('/admin/upload/course-file-chunk', form, { timeout: 120000 })) as {
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
	const res = (await request.post(
		'/admin/upload/course-file-merge',
		{
			uploadId,
			totalChunks,
			fileName,
		},
		{ timeout: 300000 },
	)) as { data: { url: string; fileUrl: string; fileName: string; fileType: string } };
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

/** 获取课程文件直传 OSS 签名 URL（绕过云托管 413） */
export async function getCourseFileUploadUrl(fileName: string): Promise<{
	url: string;
	method: 'PUT';
	contentType: string;
	headers: Record<string, string>;
	path: string;
	finalFileUrl: string;
	fileName: string;
	fileType: string;
}> {
	const res = (await request.post('/admin/upload/course-file-upload-url', { fileName })) as {
		data: { url: string; method: 'PUT'; contentType: string; headers: Record<string, string>; path: string; finalFileUrl: string; fileName: string; fileType: string };
	};
	const data = res?.data ?? res;
	if (!data?.url || data?.method !== 'PUT' || !data?.contentType) {
		throw new Error((data as any)?.errmsg || '获取上传凭证失败');
	}
	return {
		url: data.url,
		method: data.method,
		contentType: data.contentType,
		headers: data.headers || { 'Content-Type': data.contentType },
		path: data.path,
		finalFileUrl: data.finalFileUrl,
		fileName: data.fileName || fileName,
		fileType: data.fileType || (fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'doc'),
	};
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function uploadCourseFileChunkWithRetry(
	chunk: Blob,
	uploadId: string,
	chunkIndex: number,
	totalChunks: number,
	fileName: string,
) {
	let lastError: any;
	for (let retry = 1; retry <= MAX_CHUNK_RETRY; retry++) {
		try {
			return await uploadCourseFileChunk(chunk, uploadId, chunkIndex, totalChunks, fileName);
		} catch (error) {
			lastError = error;
			if (retry < MAX_CHUNK_RETRY) {
				await sleep(600 * retry);
			}
		}
	}
	throw lastError;
}

/** 直传文件到 OSS（浏览器直接 PUT 到签名 URL，不经过后端，无 413） */
export async function uploadCourseFileToOss(file: File, credentials: {
	url: string;
	method: 'PUT';
	contentType: string;
	headers: Record<string, string>;
	path: string;
}, options?: UploadCourseFileOptions): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open(credentials.method, credentials.url);
		Object.entries(credentials.headers || {}).forEach(([name, value]) => xhr.setRequestHeader(name, value));
		xhr.timeout = 30 * 60 * 1000;
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				options?.onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)), '正在上传到对象存储');
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(`直传失败: ${xhr.status} ${xhr.responseText || ''}`.trim()));
		};
		xhr.onerror = () => reject(new Error('直传失败：网络异常或跨域限制'));
		xhr.ontimeout = () => reject(new Error('直传失败：上传超时'));
		xhr.send(file);
	});
}

/** 上传课程文件（PDF/Word）：优先对象存储直传，失败时后端分片兜底 */
export async function uploadCourseFile(
	file: File,
	options?: UploadCourseFileOptions,
): Promise<{ url: string; fileUrl: string; fileName: string; fileType: string }> {
	const name = (file.name || '').trim();
	if (!name || !/\.(pdf|doc|docx)$/i.test(name)) {
		throw new Error('仅支持 PDF、Word（.doc/.docx）文件');
	}

	// 首选直传对象存储：不经过后端转发，最适合大文件。
	try {
		options?.onProgress?.(1, '正在获取上传凭证');
		const credentials = await getCourseFileUploadUrl(name);
		await uploadCourseFileToOss(file, credentials, options);
		options?.onProgress?.(100, '上传完成');
		return {
			url: credentials.finalFileUrl,
			fileUrl: credentials.finalFileUrl,
			fileName: credentials.fileName,
			fileType: credentials.fileType,
		};
	} catch (directError: any) {
		console.warn('课程文件直传失败，尝试后端分片上传:', directError?.message || directError);
	}

	// 兜底：分片上传，避免单个请求 413；每片失败自动重试。
	if (file.size > CHUNK_SIZE) {
		const uploadId = generateUploadId();
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		for (let i = 0; i < totalChunks; i++) {
			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);
			options?.onProgress?.(Math.max(1, Math.round((i / totalChunks) * 95)), `正在上传分片 ${i + 1}/${totalChunks}`);
			await uploadCourseFileChunkWithRetry(chunk, uploadId, i, totalChunks, name);
		}
		options?.onProgress?.(96, '正在合并文件');
		const result = await mergeCourseFileChunks(uploadId, totalChunks, name);
		options?.onProgress?.(100, '上传完成');
		return result;
	}

	const formData = new FormData();
	formData.append('file', file);
	options?.onProgress?.(20, '正在上传文件');
	const res = (await request.post('/admin/upload/course-file', formData, { timeout: 180000 })) as { data: { url: string; fileUrl: string; fileName: string; fileType: string } };
	const data = res?.data ?? res;
	if (!data?.url && !data?.fileUrl) {
		throw new Error('上传失败：未返回文件地址');
	}
	options?.onProgress?.(100, '上传完成');
	return {
		url: data.url || data.fileUrl,
		fileUrl: data.fileUrl || data.url,
		fileName: data.fileName || file.name,
		fileType: data.fileType || (file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'doc'),
	};
}
