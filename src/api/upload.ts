import request from '@/utils/request';

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
